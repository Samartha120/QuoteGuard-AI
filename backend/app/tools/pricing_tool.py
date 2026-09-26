from typing import Dict, Any, List
from app.rag.retriever import retriever

def lookup_price(product_code: str) -> List[Dict[str, Any]]:
    """Tool: Searches approved pricing schedules in vector store for unit price and discount rules."""
    query = f"price unit_price {product_code} pricing schedule"
    return retriever.retrieve_evidence(query=query, top_k=3, doc_type="pricing")
