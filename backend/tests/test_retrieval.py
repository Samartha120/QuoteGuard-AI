import pytest

from app.core.config import settings
from app.rag.vector_store import ChromaVectorStore
from app.rag.retriever import GroundedRetriever
import app.rag.retriever as retriever_module


@pytest.fixture
def isolated_retriever(tmp_path, monkeypatch):
    """Builds a retrieval stack backed by a throwaway Chroma store under tmp_path,
    so tests never read from or write into the real knowledge base the app uses.

    The real `vector_store` / `retriever` singletons in app.rag are created once at
    import time and point at settings.CHROMA_PERSIST_DIRECTORY (the live data). We
    patch that setting *before* constructing a fresh ChromaVectorStore, so the new
    store is isolated, then swap it into app.rag.retriever's module namespace (which
    is what GroundedRetriever.retrieve_evidence actually looks up at call time).
    """
    monkeypatch.setattr(settings, "CHROMA_PERSIST_DIRECTORY", str(tmp_path / "test_chroma"))

    test_store = ChromaVectorStore()
    monkeypatch.setattr(retriever_module, "vector_store", test_store)

    test_retriever = GroundedRetriever()
    return test_store, test_retriever


def test_vector_store_add_and_search(isolated_retriever):
    test_store, test_retriever = isolated_retriever
    sample_chunks = [
        {
            "chunk_id": "test_c1",
            "content": "IV-200 Industrial Valve unit price is INR 4500 per unit.",
            "metadata": {"doc_id": "d1", "filename": "pricing.csv", "doc_type": "pricing"}
        }
    ]
    test_store.add_documents(sample_chunks)
    results = test_retriever.retrieve_evidence("IV-200 price", top_k=1)

    assert len(results) > 0
    assert "IV-200" in results[0]["content"]
