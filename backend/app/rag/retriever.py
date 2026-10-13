from typing import List, Dict, Any, Optional
from app.rag.vector_store import vector_store
from app.core.config import settings
from app.core.logging import logger


class GroundedRetriever:
    """Hybrid retrieval: combine vector (semantic) search with exact keyword search, then
    (when a real LLM is available) let the LLM re-rank the merged candidates before the
    grounding threshold is applied.

    Vector similarity alone is weak on exact terms that don't paraphrase well — a product
    code ("IV-200"), a specific payment term ("Net 30"), a grade ("SS304") — because cosine
    similarity rewards overall wording match, not an exact token hit. Keyword search is the
    opposite: strong on exact terms, blind to synonyms or rephrasing. Combining both and
    scoring on a weighted blend catches what either one alone would miss; the LLM re-rank
    pass then picks the chunks a human would actually use among that combined candidate set,
    which plain scoring can't always judge (e.g. a chunk that matches more keywords but
    describes the wrong product entirely).
    """

    def __init__(self, threshold: float = None, vector_weight: float = 0.6):
        self.threshold = threshold or settings.GROUNDING_THRESHOLD
        self.vector_weight = vector_weight  # keyword_search gets (1 - vector_weight)

    def retrieve_evidence(self, query: str, top_k: int = 4, doc_type: Optional[str] = None,
                           rerank: bool = True) -> List[Dict[str, Any]]:
        """Retrieves candidate evidence chunks matching query, filtered by similarity threshold.

        `score` / `is_grounded` always reflect pure vector similarity — that's what the
        grounding threshold (and everything downstream that reads a chunk's confidence, e.g.
        app/utils/confidence.py and the citation picker) was calibrated against. `hybrid_score`
        carries the blended vector+keyword score and is used ONLY to rank/select candidates
        here; it must never replace `score`, or real items can drop below the grounding
        threshold purely because keyword search didn't also hit them (an exact-code search
        like "IV-200" scores 0 on keyword_score for a chunk that only paraphrases it, which
        pulls the blend down even when the vector match alone was comfortably grounded).
        """
        where_clause = {"doc_type": doc_type} if doc_type else None
        # over-fetch on both sides so the merge/rerank has real candidates to choose among,
        # not just whatever a single top_k vector search happened to return
        fetch_k = max(top_k * 3, 9)
        vector_results = vector_store.search(query=query, top_k=fetch_k, where_filter=where_clause)
        keyword_results = vector_store.keyword_search(query=query, top_k=fetch_k, where_filter=where_clause)

        merged = self._merge(vector_results, keyword_results)
        pool = merged[: max(top_k * 2, top_k + 3)]

        do_rerank = rerank and settings.RETRIEVAL_RERANK
        results = self._llm_rerank(query, pool, top_k) if do_rerank else pool[:top_k]

        for item in results:
            item["is_grounded"] = item["score"] >= self.threshold
        return results

    def _merge(self, vector_results: List[Dict[str, Any]], keyword_results: List[Dict[str, Any]]
               ) -> List[Dict[str, Any]]:
        """Combines both result lists by chunk_id into one deduplicated list. `score` stays the
        chunk's vector similarity (0.0 for a chunk keyword search alone surfaced); `hybrid_score`
        is the blended value, kept separately and used only for ordering/selection."""
        by_id: Dict[str, Dict[str, Any]] = {}
        for r in vector_results:
            by_id[r["chunk_id"]] = {**r, "vector_score": r["score"], "keyword_score": 0.0}
        for r in keyword_results:
            existing = by_id.get(r["chunk_id"])
            if existing:
                existing["keyword_score"] = r["score"]
            else:
                # keyword-only hit: no vector score for this chunk, so `score` (vector
                # similarity) is 0.0 — it can still be selected via hybrid_score, but it won't
                # be reported as grounded off keyword matching alone.
                by_id[r["chunk_id"]] = {**r, "score": 0.0, "vector_score": 0.0, "keyword_score": r["score"]}

        merged = list(by_id.values())
        for item in merged:
            item["hybrid_score"] = round(
                self.vector_weight * item["vector_score"] + (1 - self.vector_weight) * item["keyword_score"], 4)
        merged.sort(key=lambda x: x["hybrid_score"], reverse=True)
        return merged

    def _llm_rerank(self, query: str, candidates: List[Dict[str, Any]], top_k: int) -> List[Dict[str, Any]]:
        """Asks the LLM to reorder the merged candidates by actual usefulness. Falls back to
        the hybrid-score order (never fails the retrieval) whenever a real LLM isn't
        available or its answer can't be used."""
        if len(candidates) <= top_k:
            return candidates
        from app.llm.client import llm_client
        from app.llm.prompts import SYSTEM_PROMPT, RERANK_PROMPT
        from app.llm.structured_output import clean_and_parse_json

        if llm_client.demo_mode:
            return candidates[:top_k]

        listing = "\n".join(f"{c['chunk_id']}: {c['content'][:220]}" for c in candidates)
        prompt = RERANK_PROMPT.format(query=query, candidates=listing)
        try:
            raw = llm_client.generate_completion(system_prompt=SYSTEM_PROMPT, user_prompt=prompt)
        except Exception as e:
            logger.warning(f"Hybrid retrieval: LLM re-rank skipped ({e}); using the hybrid score order")
            return candidates[:top_k]

        parsed = clean_and_parse_json(raw)
        order = parsed.get("ranked_chunk_ids") if isinstance(parsed, dict) else None
        if not isinstance(order, list) or not order:
            logger.warning("Hybrid retrieval: LLM re-rank response was unusable; using the hybrid score order")
            return candidates[:top_k]

        by_id = {c["chunk_id"]: c for c in candidates}
        ranked = [by_id[cid] for cid in order if cid in by_id]
        seen = {c["chunk_id"] for c in ranked}
        ranked.extend(c for c in candidates if c["chunk_id"] not in seen)  # anything the LLM left out
        return ranked[:top_k]


retriever = GroundedRetriever()
