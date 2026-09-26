from typing import List
from app.core.config import settings
from app.core.logging import logger
import math
import hashlib

class EmbeddingService:
    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        self._model = None
        self._is_mock = False

    def _get_model(self):
        if self._model is None and not self._is_mock:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info(f"Loading SentenceTransformer model: {self.model_name}")
                self._model = SentenceTransformer(self.model_name)
            except Exception as e:
                logger.warning(f"Failed to load SentenceTransformer ({e}). Falling back to deterministic hashing embedder for high-speed demo mode.")
                self._is_mock = True
        return self._model

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generates embedding vectors for a list of texts."""
        if not texts:
            return []

        model = self._get_model()
        if model and not self._is_mock:
            embeddings = model.encode(texts, show_progress_bar=False)
            return embeddings.tolist()
        
        # Deterministic hashing fallback for light-weight zero-dependency demo
        dim = 384
        result = []
        for text in texts:
            vector = [0.0] * dim
            tokens = text.lower().split()
            for token in tokens:
                h = int(hashlib.md5(token.encode('utf-8')).hexdigest(), 16)
                idx = h % dim
                vector[idx] += 1.0
            
            # Normalize vector
            norm = math.sqrt(sum(x * x for x in vector)) or 1.0
            vector = [x / norm for x in vector]
            result.append(vector)
        return result

    def embed_query(self, query: str) -> List[float]:
        embeddings = self.embed_texts([query])
        return embeddings[0] if embeddings else [0.0] * 384

embedding_service = EmbeddingService()
