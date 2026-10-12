"""
Requirement Flags Module — Rule-based checks for ambiguous or incomplete requirements.

Identifies potential RFQ ambiguities early during the Requirement Analysis stage:
- quantity_range: Quantities specified as ranges or fuzzy estimates (e.g. "around 30 to 40", "20-30")
- missing_grade: Items missing an approved material alloy grade (e.g. SS304, SS316, CS)
- vague_spec: Items with ambiguous or incomplete technical specifications ("standard", "regular", "tbd")
"""
import re
from typing import List, Dict, Any, Optional

RANGE_PATTERNS = [
    re.compile(r"\b(?:around|approx|approximately|about|estimated|est\.?)\s+(\d+)", re.IGNORECASE),
    re.compile(r"(\d+)\s*(?:-|to)\s*(\d+)", re.IGNORECASE),
    re.compile(r"\bbetween\s+(\d+)\s+and\s+(\d+)\b", re.IGNORECASE),
]

VAGUE_TERMS = {
    "standard", "regular", "normal", "basic", "default",
    "as per usual", "as usual", "as discussed", "tbd", "to be determined",
    "unspecified", "general", "customary"
}


def check_quantity_range(item: Dict[str, Any], raw_text: str = "") -> Optional[Dict[str, Any]]:
    """Flag if quantity is a range or fuzzy estimate instead of a fixed integer."""
    qty = item.get("quantity")
    p_name = item.get("product_name") or item.get("product_code") or "Item"

    # Check if quantity itself is a string range like "30-40" or "around 30"
    if isinstance(qty, str):
        for pattern in RANGE_PATTERNS:
            match = pattern.search(qty)
            if match:
                return {
                    "type": "quantity_range",
                    "item": p_name,
                    "detail": f"Quantity '{qty}' is a range or estimate; exact quantity required for pricing tiers.",
                    "raw_value": qty,
                }

    # Check if requested_spec indicates an estimate
    spec = str(item.get("requested_spec") or "")
    for pattern in RANGE_PATTERNS:
        match = pattern.search(spec)
        if match:
            return {
                "type": "quantity_range",
                "item": p_name,
                "detail": f"Specification specifies range or estimated quantity '{match.group(0)}'.",
                "raw_value": match.group(0),
            }

    # If raw_text contains an estimate associated with this product
    if raw_text and p_name.lower() in raw_text.lower():
        for pattern in RANGE_PATTERNS:
            for match in pattern.finditer(raw_text):
                start, end = match.span()
                window = raw_text[max(0, start - 60):min(len(raw_text), end + 60)].lower()
                if p_name.lower() in window or (item.get("product_code") and str(item.get("product_code")).lower() in window):
                    return {
                        "type": "quantity_range",
                        "item": p_name,
                        "detail": f"RFQ text indicates fuzzy quantity '{match.group(0)}' for {p_name}.",
                        "raw_value": match.group(0),
                    }

    return None


def check_missing_grade(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Flag if material grade is missing or unspecified."""
    grade = item.get("material_grade")
    p_name = item.get("product_name") or item.get("product_code") or "Item"

    if not grade or str(grade).strip().lower() in {"", "none", "null", "unspecified", "unknown", "tbd", "n/a"}:
        return {
            "type": "missing_grade",
            "item": p_name,
            "detail": f"Material grade is not specified for '{p_name}'; engineering review or customer confirmation required.",
            "raw_value": grade,
        }
    return None


def check_vague_spec(item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Flag if requested_spec is empty, vague, or a placeholder."""
    spec = str(item.get("requested_spec") or "").strip().lower()
    p_name = item.get("product_name") or item.get("product_code") or "Item"

    if not spec or spec in {"none", "null", "n/a", "unspecified", "tbd"}:
        return {
            "type": "vague_spec",
            "item": p_name,
            "detail": f"No technical specification provided for '{p_name}'.",
            "raw_value": spec,
        }

    # Check if spec is purely a vague descriptor
    if spec in VAGUE_TERMS or any(spec == f"{term} spec" or spec == f"{term} specification" for term in VAGUE_TERMS):
        return {
            "type": "vague_spec",
            "item": p_name,
            "detail": f"Specification '{spec}' is vague and lacks dimension, rating, or seal details.",
            "raw_value": spec,
        }

    return None


def extract_requirement_flags(line_items: List[Dict[str, Any]], raw_text: str = "") -> List[Dict[str, Any]]:
    """
    Examines extracted line items and raw RFQ text to detect ambiguous or incomplete requirements.

    Returns a list of structured flag dictionaries.
    """
    flags: List[Dict[str, Any]] = []

    for item in line_items:
        # Check 1: Quantity Range
        qty_flag = check_quantity_range(item, raw_text=raw_text)
        if qty_flag:
            flags.append(qty_flag)

        # Check 2: Missing Material Grade
        grade_flag = check_missing_grade(item)
        if grade_flag:
            flags.append(grade_flag)

        # Check 3: Vague Specifications
        spec_flag = check_vague_spec(item)
        if spec_flag:
            flags.append(spec_flag)

    return flags
