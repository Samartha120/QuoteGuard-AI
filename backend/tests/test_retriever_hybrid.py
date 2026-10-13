"""Hybrid retrieval: merging vector + keyword scores, and the LLM re-rank pass — using
fake vector_store results and a fake LLM so these run without a real embedding model,
vector store or LLM (same pattern as test_retrieval_agent.py).

Vedant's review on PR #22 found that the blended score was overwriting `score` outright,
which is what the 0.80 grounding threshold reads — so an exact-code item that scored 0.90 on
vector similarity alone could drop below threshold purely because keyword search didn't also
hit it. These tests pin down the fix: `score` stays vector similarity, `hybrid_score` is the
blended value and is used only for ranking/selection."""
import json
from unittest.mock import patch

from app.core.config import settings
from app.llm.client import llm_client
from app.rag.retriever import GroundedRetriever


def _chunk(chunk_id, content="x", score=0.0):
    return {"chunk_id": chunk_id, "content": content, "metadata": {}, "score": score}


# ---- merging vector + keyword results ---------------------------------------------

def test_a_chunk_found_by_both_sides_gets_a_separate_hybrid_score():
    retriever = GroundedRetriever(vector_weight=0.5)
    vector_results = [_chunk("c1", score=0.4)]
    keyword_results = [_chunk("c1", score=0.8)]
    merged = retriever._merge(vector_results, keyword_results)
    assert merged[0]["chunk_id"] == "c1"
    assert merged[0]["hybrid_score"] == 0.6  # 0.5*0.4 + 0.5*0.8
    assert merged[0]["score"] == 0.4  # vector similarity, untouched by the blend


def test_a_chunk_found_by_only_keyword_search_is_not_dropped():
    """This is the whole point of hybrid retrieval: an exact-code hit that vector
    similarity alone scored too low to surface must still make it into the candidate set.
    Its `score` (vector similarity) is 0.0 though — it was never vector-matched — so it
    can be selected for drafting but won't be reported as grounded off keyword alone."""
    retriever = GroundedRetriever(vector_weight=0.6)
    vector_results = [_chunk("c1", score=0.9)]
    keyword_results = [_chunk("c2", score=1.0, content="IV-200 exact match")]
    merged = retriever._merge(vector_results, keyword_results)
    chunk_ids = {m["chunk_id"] for m in merged}
    assert chunk_ids == {"c1", "c2"}
    c2 = next(m for m in merged if m["chunk_id"] == "c2")
    assert c2["vector_score"] == 0.0 and c2["keyword_score"] == 1.0
    assert c2["score"] == 0.0


def test_a_chunk_found_only_by_vector_search_keeps_its_vector_score():
    retriever = GroundedRetriever(vector_weight=0.6)
    vector_results = [_chunk("c1", score=0.9)]
    merged = retriever._merge(vector_results, [])
    assert merged[0]["score"] == 0.9
    assert merged[0]["hybrid_score"] == round(0.6 * 0.9, 4)


def test_merge_sorts_by_hybrid_score_descending():
    retriever = GroundedRetriever(vector_weight=0.5)
    merged = retriever._merge([_chunk("low", score=0.1), _chunk("high", score=0.9)], [])
    assert [m["chunk_id"] for m in merged] == ["high", "low"]


# ---- LLM re-rank --------------------------------------------------------------------

def test_rerank_is_skipped_when_candidates_already_fit_top_k():
    retriever = GroundedRetriever()
    candidates = [_chunk("a"), _chunk("b")]
    with patch.object(llm_client, "generate_completion") as gen:
        result = retriever._llm_rerank("query", candidates, top_k=2)
    gen.assert_not_called()
    assert result == candidates


def test_rerank_reorders_candidates_per_the_llm_response(monkeypatch):
    retriever = GroundedRetriever()
    monkeypatch.setattr(llm_client, "demo_mode", False)
    candidates = [_chunk("a"), _chunk("b"), _chunk("c")]
    with patch.object(llm_client, "generate_completion",
                       return_value=json.dumps({"ranked_chunk_ids": ["c", "a", "b"]})):
        result = retriever._llm_rerank("query", candidates, top_k=2)
    assert [c["chunk_id"] for c in result] == ["c", "a"]


def test_rerank_falls_back_to_hybrid_order_when_llm_is_unavailable(monkeypatch):
    retriever = GroundedRetriever()
    monkeypatch.setattr(llm_client, "demo_mode", False)
    candidates = [_chunk("a"), _chunk("b"), _chunk("c")]
    with patch.object(llm_client, "generate_completion", side_effect=RuntimeError("provider down")):
        result = retriever._llm_rerank("query", candidates, top_k=2)
    assert [c["chunk_id"] for c in result] == ["a", "b"]  # original (hybrid-score) order, untouched


def test_rerank_falls_back_when_llm_response_is_unusable(monkeypatch):
    retriever = GroundedRetriever()
    monkeypatch.setattr(llm_client, "demo_mode", False)
    candidates = [_chunk("a"), _chunk("b"), _chunk("c")]
    with patch.object(llm_client, "generate_completion", return_value="not json"):
        result = retriever._llm_rerank("query", candidates, top_k=2)
    assert [c["chunk_id"] for c in result] == ["a", "b"]


def test_rerank_keeps_a_chunk_the_llm_left_out(monkeypatch):
    """The LLM must never cause a real retrieved chunk to silently disappear — anything it
    omits from ranked_chunk_ids is appended at the end, in the original order."""
    retriever = GroundedRetriever()
    monkeypatch.setattr(llm_client, "demo_mode", False)
    candidates = [_chunk("a"), _chunk("b"), _chunk("c")]
    with patch.object(llm_client, "generate_completion",
                       return_value=json.dumps({"ranked_chunk_ids": ["b"]})):
        result = retriever._llm_rerank("query", candidates, top_k=2)
    assert [c["chunk_id"] for c in result] == ["b", "a"]


def test_rerank_is_skipped_outright_in_demo_mode(monkeypatch):
    retriever = GroundedRetriever()
    monkeypatch.setattr(llm_client, "demo_mode", True)
    candidates = [_chunk("a"), _chunk("b"), _chunk("c")]
    with patch.object(llm_client, "generate_completion") as gen:
        result = retriever._llm_rerank("query", candidates, top_k=2)
    gen.assert_not_called()
    assert [c["chunk_id"] for c in result] == ["a", "b"]


# ---- full retrieve_evidence, end to end with fakes -----------------------------------

def test_retrieve_evidence_marks_grounding_from_vector_score_not_hybrid_score():
    """The regression Vedant's review caught: a chunk with strong vector similarity but no
    keyword hit must still be gradeable against the grounding threshold on its own merit,
    not pulled down by the blend. vector_weight=0.5 with no keyword match would roughly
    halve a blended score; `score`/`is_grounded` must be unaffected by that."""
    retriever = GroundedRetriever(threshold=0.80, vector_weight=0.5)
    with patch("app.rag.retriever.vector_store") as vs:
        vs.search.return_value = [_chunk("strong-vector-no-keyword", score=0.90)]
        vs.keyword_search.return_value = []
        results = retriever.retrieve_evidence("IV-200 pricing", top_k=1, rerank=False)
    assert results[0]["score"] == 0.90
    assert results[0]["is_grounded"] is True
    # the hybrid_score (ranking-only) would have been ~0.45 with no keyword match
    assert results[0]["hybrid_score"] < 0.80


def test_retrieve_evidence_marks_grounding_from_the_vector_score_below_threshold():
    retriever = GroundedRetriever(threshold=0.5, vector_weight=1.0)
    with patch("app.rag.retriever.vector_store") as vs:
        vs.search.return_value = [_chunk("above", score=0.9), _chunk("below", score=0.1)]
        vs.keyword_search.return_value = []
        results = retriever.retrieve_evidence("query", top_k=2, rerank=False)
    grounded = {r["chunk_id"]: r["is_grounded"] for r in results}
    assert grounded == {"above": True, "below": False}


def test_retrieve_evidence_skips_llm_rerank_when_setting_is_off(monkeypatch):
    monkeypatch.setattr(settings, "RETRIEVAL_RERANK", False)
    retriever = GroundedRetriever()
    with patch("app.rag.retriever.vector_store") as vs, \
         patch.object(llm_client, "generate_completion") as gen:
        vs.search.return_value = [_chunk(f"c{i}", score=0.9 - i * 0.01) for i in range(6)]
        vs.keyword_search.return_value = []
        retriever.retrieve_evidence("query", top_k=2, rerank=True)
    gen.assert_not_called()


def test_retrieve_evidence_reranks_when_setting_is_on(monkeypatch):
    monkeypatch.setattr(settings, "RETRIEVAL_RERANK", True)
    monkeypatch.setattr(llm_client, "demo_mode", False)
    retriever = GroundedRetriever()
    with patch("app.rag.retriever.vector_store") as vs, \
         patch.object(llm_client, "generate_completion",
                       return_value=json.dumps({"ranked_chunk_ids": ["c1", "c0"]})) as gen:
        vs.search.return_value = [_chunk(f"c{i}", score=0.9 - i * 0.01) for i in range(6)]
        vs.keyword_search.return_value = []
        retriever.retrieve_evidence("query", top_k=2, rerank=True)
    gen.assert_called_once()
