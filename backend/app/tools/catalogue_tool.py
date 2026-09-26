from typing import Dict, Any, List
from app.rag.retriever import retriever

def search_catalogue(product_query: str) -> List[Dict[str, Any]]:
    """Tool: Searches approved catalogue documents in vector store for product specification match."""
    return retriever.retrieve_evidence(query=product_query, top_k=3, doc_type="catalog")
