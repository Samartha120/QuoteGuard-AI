import json
import re
from typing import Dict, Any

def clean_and_parse_json(text: str) -> Dict[str, Any]:
    """Cleans markdown code fences and parses JSON response robustly."""
    if not text:
        return {}
    
    cleaned = text.strip()
    # Strip markdown ```json ... ``` wrapper if present
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except Exception as e:
        # Fallback regex extraction if json text is embedded in prose
        match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except Exception:
                pass
        return {"error": f"Failed to parse JSON: {str(e)}", "raw": text}
