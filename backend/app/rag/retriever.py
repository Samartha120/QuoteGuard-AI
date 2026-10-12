from typing import List, Dict, Any, Optional
from app.rag.vector_store import vector_store
from app.core.config import settings

class GroundedRetriever:
    def __init__(self, threshold: float = None):
        self.threshold = threshold or settings.GROUNDING_THRESHOLD

    def retrieve_evidence(self, query: str, top_k: int = 4, doc_type: Optional[str] = None) -> List[Dict[str, Any]]:
        """Retrieves candidate evidence chunks matching query, filtered by similarity threshold."""
        where_clause = {"doc_type": doc_type} if doc_type else None
        results = vector_store.search(query=query, top_k=top_k, where_filter=where_clause)
        
        # Add grounding status flag to each result
        for item in results:
            item["is_grounded"] = item["score"] >= self.threshold
            
        return results

retriever = GroundedRetriever()
