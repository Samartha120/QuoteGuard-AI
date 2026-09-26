from app.rag.vector_store import vector_store
from app.rag.retriever import retriever

def test_vector_store_add_and_search():
    sample_chunks = [
        {
            "chunk_id": "test_c1",
            "content": "IV-200 Industrial Valve unit price is INR 4500 per unit.",
            "metadata": {"doc_id": "d1", "filename": "pricing.csv", "doc_type": "pricing"}
        }
    ]
    vector_store.add_documents(sample_chunks)
    results = retriever.retrieve_evidence("IV-200 price", top_k=1)
    
    assert len(results) > 0
    assert "IV-200" in results[0]["content"]
