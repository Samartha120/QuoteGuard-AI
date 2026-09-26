from typing import Dict, Any, List
from app.rag.retriever import retriever

def get_delivery_policy() -> List[Dict[str, Any]]:
    """Tool: Retrieves commercial delivery, warranty, and credit payment terms."""
    return retriever.retrieve_evidence(query="payment terms credit freight delivery ex-works warranty", top_k=3, doc_type="policy")
