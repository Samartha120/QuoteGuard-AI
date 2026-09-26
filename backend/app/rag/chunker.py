from typing import List, Dict, Any

class DocumentChunker:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def create_chunks(self, text: str, metadata: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Splits document text into overlapping recursive character chunks with rich metadata."""
        if not text:
            return []

        chunks = []
        start = 0
        text_length = len(text)
        chunk_idx = 0

        while start < text_length:
            end = min(start + self.chunk_size, text_length)
            
            # Try to break at newline or period if possible
            if end < text_length:
                last_newline = text.rfind('\n', start, end)
                if last_newline != -1 and last_newline > start + 200:
                    end = last_newline + 1
                else:
                    last_period = text.rfind('. ', start, end)
                    if last_period != -1 and last_period > start + 200:
                        end = last_period + 1

            chunk_text = text[start:end].strip()
            
            if chunk_text:
                chunk_meta = metadata.copy()
                chunk_meta["chunk_id"] = f"{metadata.get('doc_id', 'doc')}_chunk_{chunk_idx}"
                chunk_meta["chunk_index"] = chunk_idx
                
                chunks.append({
                    "chunk_id": chunk_meta["chunk_id"],
                    "content": chunk_text,
                    "metadata": chunk_meta
                })
                chunk_idx += 1

            start += (self.chunk_size - self.chunk_overlap)
            if start >= text_length or end == text_length:
                break

        return chunks

chunker = DocumentChunker()
