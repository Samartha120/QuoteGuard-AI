from app.rag.parser import parse_document
from app.rag.chunker import chunker
from typing import List, Dict, Any

def process_and_chunk_file(file_path: str, filename: str, doc_id: str, doc_type: str) -> List[Dict[str, Any]]:
    """Loads a document from file_path, parses text, and generates structured chunks."""
    raw_text = parse_document(file_path, filename)
    metadata = {
        "doc_id": doc_id,
        "filename": filename,
        "doc_type": doc_type,
        "source_path": file_path
    }
    chunks = chunker.create_chunks(raw_text, metadata)
    return chunks
