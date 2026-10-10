from typing import List, Dict, Any, Optional
import os
import re
from app.core.config import settings
from app.core.logging import logger
from app.rag.embeddings import embedding_service

# A "token" keeps hyphenated codes whole ("IV-200", "SS304") instead of splitting them,
# since those are exactly the terms vector similarity is weakest on and keyword search
# needs to be strongest on.
_TOKEN = re.compile(r"[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*")
_STOPWORDS = {"the", "a", "an", "of", "for", "and", "or", "to", "in", "on", "is", "are",
              "with", "this", "that", "please", "quote"}


def _tokens(text: str) -> List[str]:
    return [t.lower() for t in _TOKEN.findall(text or "") if len(t) > 1 and t.lower() not in _STOPWORDS]

class ChromaVectorStore:
    def __init__(self):
        self.persist_directory = settings.CHROMA_PERSIST_DIRECTORY
        os.makedirs(self.persist_directory, exist_ok=True)
        self.collection_name = "quoteguard_knowledge"
        self._client = None
        self._collection = None
        self._fallback_store = [] # In-memory fallback if ChromaDB native bindings fail

    def _get_collection(self):
        if self._collection is None:
            try:
                import chromadb
                self._client = chromadb.PersistentClient(path=self.persist_directory)
                self._collection = self._client.get_or_create_collection(
                    name=self.collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
                logger.info(f"Initialized ChromaDB collection: {self.collection_name}")
            except Exception as e:
                logger.warning(f"ChromaDB initialization failed ({e}). Using in-memory vector index fallback.")
        return self._collection

    def add_documents(self, chunks: List[Dict[str, Any]]):
        if not chunks:
            return

        ids = [c["chunk_id"] for c in chunks]
        documents = [c["content"] for c in chunks]
        metadatas = [c["metadata"] for c in chunks]
        embeddings = embedding_service.embed_texts(documents)

        coll = self._get_collection()
        if coll is not None:
            try:
                coll.add(
                    ids=ids,
                    documents=documents,
                    metadatas=metadatas,
                    embeddings=embeddings
                )
                return
            except Exception as e:
                logger.error(f"Error adding documents to ChromaDB: {e}")

        # Fallback store
        for i in range(len(ids)):
            self._fallback_store.append({
                "id": ids[i],
                "document": documents[i],
                "metadata": metadatas[i],
                "embedding": embeddings[i]
            })

    def search(self, query: str, top_k: int = 5, where_filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        query_embedding = embedding_service.embed_query(query)
        coll = self._get_collection()

        if coll is not None:
            try:
                kwargs = {
                    "query_embeddings": [query_embedding],
                    "n_results": top_k
                }
                if where_filter:
                    kwargs["where"] = where_filter
                    
                results = coll.query(**kwargs)
                formatted = []
                if results and results.get("ids") and len(results["ids"]) > 0:
                    for i in range(len(results["ids"][0])):
                        doc_id = results["ids"][0][i]
                        doc = results["documents"][0][i]
                        meta = results["metadatas"][0][i]
                        distance = results["distances"][0][i] if "distances" in results else 0.1
                        # Cosine similarity formula from distance
                        score = max(0.0, min(1.0, 1.0 - (distance / 2.0)))
                        formatted.append({
                            "chunk_id": doc_id,
                            "content": doc,
                            "metadata": meta,
                            "score": round(score, 4)
                        })
                return formatted
            except Exception as e:
                logger.error(f"Error querying ChromaDB: {e}")

        # Fallback similarity search using dot product on normalized embeddings
        results = []
        for item in self._fallback_store:
            emb = item["embedding"]
            score = sum(q * e for q, e in zip(query_embedding, emb))
            # Rescale dot product to 0-1 range
            norm_score = max(0.0, min(1.0, (score + 1.0) / 2.0))
            results.append({
                "chunk_id": item["id"],
                "content": item["document"],
                "metadata": item["metadata"],
                "score": round(norm_score, 4)
            })
        
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:top_k]

    def keyword_search(self, query: str, top_k: int = 5, where_filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Exact-term search: scores every chunk by how many of the query's tokens it
        contains, weighted by token length (so a specific hit like "IV-200" or "Net 30"
        counts for more than a short common word). This is what vector similarity alone
        tends to miss — an exact code or term can score low on cosine similarity if the
        surrounding wording differs, even though it's the single strongest signal a human
        reader would use.
        """
        query_tokens = set(_tokens(query))
        if not query_tokens:
            return []

        candidates = self._all_chunks(where_filter)
        scored = []
        for item in candidates:
            content_tokens = _tokens(item["document"])
            content_set = set(content_tokens)
            hits = query_tokens & content_set
            if not hits:
                continue
            raw_score = sum(len(t) for t in hits)
            max_score = sum(len(t) for t in query_tokens) or 1
            scored.append({
                "chunk_id": item["id"],
                "content": item["document"],
                "metadata": item["metadata"],
                "score": round(min(1.0, raw_score / max_score), 4),
            })

        scored.sort(key=lambda x: x["score"], reverse=True)
        return scored[:top_k]

    def _all_chunks(self, where_filter: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Every chunk (id, document, metadata) matching the filter, from whichever
        backing store is active. Used by keyword_search, which needs to score every
        candidate rather than rely on an approximate nearest-neighbour index."""
        coll = self._get_collection()
        if coll is not None:
            try:
                kwargs = {"include": ["documents", "metadatas"]}
                if where_filter:
                    kwargs["where"] = where_filter
                result = coll.get(**kwargs)
                return [
                    {"id": result["ids"][i], "document": result["documents"][i], "metadata": result["metadatas"][i]}
                    for i in range(len(result.get("ids", [])))
                ]
            except Exception as e:
                logger.error(f"Error reading all chunks from ChromaDB: {e}")

        if where_filter:
            key, value = next(iter(where_filter.items()))
            return [{"id": i["id"], "document": i["document"], "metadata": i["metadata"]}
                    for i in self._fallback_store if i["metadata"].get(key) == value]
        return [{"id": i["id"], "document": i["document"], "metadata": i["metadata"]} for i in self._fallback_store]

    def delete_by_document_id(self, document_id: str):
        coll = self._get_collection()
        if coll is not None:
            try:
                coll.delete(where={"doc_id": document_id})
            except Exception as e:
                logger.error(f"Failed to delete document {document_id} from ChromaDB: {e}")
        
        self._fallback_store = [x for x in self._fallback_store if x["metadata"].get("doc_id") != document_id]

vector_store = ChromaVectorStore()
