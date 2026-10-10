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
        """Retrieves candidate evidence chunks matching query, filtered by similarity threshold."""
        where_clause = {"doc_type": doc_type} if doc_type else None
        # over-fetch on both sides so the merge/rerank has real candidates to choose among,
        # not just whatever a single top_k vector search happened to return
        fetch_k = max(top_k * 3, 9)
        vector_results = vector_store.search(query=query, top_k=fetch_k, where_filter=where_clause)
        keyword_results = vector_store.keyword_search(query=query, top_k=fetch_k, where_filter=where_clause)

        merged = self._merge(vector_results, keyword_results)
        pool = merged[: max(top_k * 2, top_k + 3)]

        results = self._llm_rerank(query, pool, top_k) if rerank else pool[:top_k]

        for item in results:
            item["is_grounded"] = item["score"] >= self.threshold
        return results

    def _merge(self, vector_results: List[Dict[str, Any]], keyword_results: List[Dict[str, Any]]
               ) -> List[Dict[str, Any]]:
        """Combines both result lists by chunk_id into one hybrid-scored, deduplicated list."""
        by_id: Dict[str, Dict[str, Any]] = {}
        for r in vector_results:
            by_id[r["chunk_id"]] = {**r, "vector_score": r["score"], "keyword_score": 0.0}
        for r in keyword_results:
            existing = by_id.get(r["chunk_id"])
            if existing:
                existing["keyword_score"] = r["score"]
            else:
                by_id[r["chunk_id"]] = {**r, "vector_score": 0.0, "keyword_score": r["score"]}

        merged = list(by_id.values())
        for item in merged:
            item["score"] = round(
                self.vector_weight * item["vector_score"] + (1 - self.vector_weight) * item["keyword_score"], 4)
        merged.sort(key=lambda x: x["score"], reverse=True)
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
