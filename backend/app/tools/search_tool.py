from typing import Dict, Any, List
from app.rag.retriever import retriever

def search_knowledge_base(query: str, top_k: int = 4) -> List[Dict[str, Any]]:
    """Tool: Unified semantic search across all approved company knowledge documents."""
    return retriever.retrieve_evidence(query=query, top_k=top_k)
