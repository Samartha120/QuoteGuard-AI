import csv
import os
from typing import Dict, Any, List, Optional

from app.core.config import settings
from app.core.logging import logger

# Cache keyed by (path, mtime) so edits to the approved CSV are picked up automatically.
_CACHE: Dict[str, Any] = {"key": None, "rows": {}, "grades": set()}


def _coerce_float(value: str, default: float = 0.0) -> float:
    try:
        return float(str(value).strip())
    except (TypeError, ValueError):
        return default


def _load_catalog() -> Dict[str, Dict[str, Any]]:
    """Parses the approved pricing CSV into a structured catalog keyed by product code.
    This is the single source of truth for grounded pricing/specs — no prices live in code."""
    path = settings.PRICING_CSV_PATH
    if not os.path.exists(path):
        logger.warning(f"Approved pricing CSV not found at {path}")
        return {}

    mtime = os.path.getmtime(path)
    cache_key = f"{path}:{mtime}"
    if _CACHE["key"] == cache_key:
        return _CACHE["rows"]

    rows: Dict[str, Dict[str, Any]] = {}
    grades = set()
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for r in reader:
            code = (r.get("Product Code") or "").strip()
            if not code:
                continue
            grade = (r.get("Material Grade") or "").strip()
            grades.add(grade.upper())
            rows[code] = {
                "code": code,
                "name": (r.get("Product Name") or "").strip(),
                "grade": grade,
                "unit_price": _coerce_float(r.get("Unit Price (INR)")),
                "moq": int(_coerce_float(r.get("MoQ (Units)"), 1)),
                "bulk_threshold": int(_coerce_float(r.get("Bulk Discount Threshold"), 0)),
                "bulk_discount_rate": _coerce_float(r.get("Bulk Discount Rate (%)")),
                "lead_time_days": int(_coerce_float(r.get("Lead Time (Days)"), 0)),
                "source": os.path.basename(path),
            }

    _CACHE.update({"key": cache_key, "rows": rows, "grades": grades})
    logger.info(f"Loaded {len(rows)} approved catalog rows from {os.path.basename(path)}")
    return rows


def get_catalog() -> Dict[str, Dict[str, Any]]:
    return _load_catalog()


def approved_grades() -> set:
    _load_catalog()
    return set(_CACHE["grades"])


def lookup_product(product_code: str = "", product_name: str = "") -> Optional[Dict[str, Any]]:
    """Resolves a requirement to an approved catalog row by code, then by fuzzy name match."""
    catalog = _load_catalog()
    if not catalog:
        return None

    code = (product_code or "").strip().upper()
    for c, row in catalog.items():
        if c.upper() == code:
            return row

    name = (product_name or "").lower()
    if name:
        # code embedded in the requirement text (e.g. "Industrial Valve IV-200")
        for c, row in catalog.items():
            if c.lower() in name:
                return row
        for row in catalog.values():
            if row["name"].lower() in name or name in row["name"].lower():
                return row
    return None


def price_for_quantity(row: Dict[str, Any], quantity: int) -> Dict[str, Any]:
    """Applies the approved bulk-discount schedule to derive the grounded unit price."""
    unit_price = row["unit_price"]
    discount_applied = 0.0
    if row.get("bulk_threshold") and quantity >= row["bulk_threshold"] and row.get("bulk_discount_rate"):
        discount_applied = row["bulk_discount_rate"]
        unit_price = round(unit_price * (1 - discount_applied / 100.0), 2)
    return {
        "unit_price": unit_price,
        "list_price": row["unit_price"],
        "discount_rate": discount_applied,
        "total_price": round(unit_price * quantity, 2),
    }
