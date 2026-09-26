from typing import List, Dict, Any

def compute_field_confidence(field_name: str, extracted_value: str, retrieved_chunks: List[Dict[str, Any]], is_spec_mismatch: bool = False) -> float:
    """Calculates quantitative grounding confidence score (0.0 to 1.0) per commercial field."""
    if is_spec_mismatch:
        return 0.40 # Heavy penalty for material spec mismatch (e.g. SS316 requested vs SS304 stock)
        
    if not retrieved_chunks:
        return 0.0

    # Max retrieval score among chunks
    max_score = max(c.get("score", 0.0) for c in retrieved_chunks)
    
    # Check if exact keyword/product code appears in content
    exact_match_bonus = 0.0
    val_lower = str(extracted_value).lower()
    for c in retrieved_chunks:
        if val_lower in c.get("content", "").lower():
            exact_match_bonus = 0.10
            break

    confidence = round(min(1.0, max_score + exact_match_bonus), 2)
    return confidence
