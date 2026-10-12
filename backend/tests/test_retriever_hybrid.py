"""Hybrid retrieval: merging vector + keyword scores, and the LLM re-rank pass — using
fake vector_store results and a fake LLM so these run without a real embedding model,
vector store or LLM (same pattern as test_retrieval_agent.py)."""
import json
from unittest.mock import patch

from app.llm.client import llm_client
from app.rag.retriever import GroundedRetriever


def _chunk(chunk_id, content="x", score=0.0):
    return {"chunk_id": chunk_id, "content": content, "metadata": {}, "score": score}


# ---- merging vector + keyword results ---------------------------------------------

def test_a_chunk_found_by_both_sides_combines_both_scores():
    retriever = GroundedRetriever(vector_weight=0.5)
    vector_results = [_chunk("c1", score=0.4)]
    keyword_results = [_chunk("c1", score=0.8)]
    merged = retriever._merge(vector_results, keyword_results)
    assert merged[0]["chunk_id"] == "c1"
    assert merged[0]["score"] == 0.6  # 0.5*0.4 + 0.5*0.8


def test_a_chunk_found_by_only_keyword_search_is_not_dropped():
    """This is the whole point of hybrid retrieval: an exact-code hit that vector
    similarity alone scored too low to surface must still make it into the candidate set."""
    retriever = GroundedRetriever(vector_weight=0.6)
    vector_results = [_chunk("c1", score=0.9)]
    keyword_results = [_chunk("c2", score=1.0, content="IV-200 exact match")]
    merged = retriever._merge(vector_results, keyword_results)
    chunk_ids = {m["chunk_id"] for m in merged}
    assert chunk_ids == {"c1", "c2"}
    c2 = next(m for m in merged if m["chunk_id"] == "c2")
    assert c2["vector_score"] == 0.0 and c2["keyword_score"] == 1.0


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

def test_retrieve_evidence_marks_grounding_from_the_hybrid_score():
    retriever = GroundedRetriever(threshold=0.5, vector_weight=1.0)
    with patch("app.rag.retriever.vector_store") as vs:
        vs.search.return_value = [_chunk("above", score=0.9), _chunk("below", score=0.1)]
        vs.keyword_search.return_value = []
        results = retriever.retrieve_evidence("query", top_k=2, rerank=False)
    grounded = {r["chunk_id"]: r["is_grounded"] for r in results}
    assert grounded == {"above": True, "below": False}
