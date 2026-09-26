from typing import Dict, Any, List

def calculate_quotation_totals(line_items: List[Dict[str, Any]], tax_rate: float = 0.18) -> Dict[str, float]:
    """Tool: Calculates subtotal, GST tax, and total quotation amount with mathematical precision."""
    subtotal = sum(item.get("total_price", 0.0) or 0.0 for item in line_items)
    tax_amount = round(subtotal * tax_rate, 2)
    total_amount = round(subtotal + tax_amount, 2)
    return {
        "subtotal": round(subtotal, 2),
        "tax_amount": tax_amount,
        "total_amount": total_amount
    }
