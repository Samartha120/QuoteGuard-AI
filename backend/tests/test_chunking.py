from app.rag.chunker import chunker

def test_document_chunker():
    sample_text = "This is paragraph 1.\n\nThis is paragraph 2 with details about IV-200 valve.\n\nParagraph 3."
    metadata = {"doc_id": "test_doc_01", "filename": "sample.txt"}
    chunks = chunker.create_chunks(sample_text, metadata)
    
    assert len(chunks) > 0
    assert chunks[0]["metadata"]["doc_id"] == "test_doc_01"
    assert "IV-200" in chunks[0]["content"] or len(chunks) > 1
