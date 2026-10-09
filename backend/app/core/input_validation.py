"""Checks on what users send in and what the Requirement Analysis Agent reads out of it.

Two places bad input can hurt the system:

1. At the API (`validate_rfq_text`, `validate_upload`, `validate_customer_name`):
   empty or near-empty text, gibberish, a binary file pasted as text, an unsupported
   or oversized file, or a PDF with no extractable text (a scan). These are rejected
   with a message that tells the user what to fix, before any LLM is called.

2. After extraction (`normalize_requirements`): the LLM may return a quantity as
   text ("30 units"), a range ("30 to 40"), a negative or zero number, or a product
   the RFQ never mentions. Quantities are coerced or cleared, invented products are
   dropped, and every change is noted so Validation & Planning can ask the customer.
"""
import os
import re
from typing import Any, Dict, List, Optional, Tuple

MAX_RFQ_CHARS = 20_000          # a long RFQ is a few pages; more is almost certainly not one
MIN_RFQ_WORDS = 5
MAX_UPLOAD_BYTES = 5 * 1024 * 1024
ALLOWED_UPLOAD_TYPES = {".pdf", ".docx", ".txt", ".md", ".csv"}
MAX_CUSTOMER_NAME = 200
MAX_QUANTITY = 1_000_000        # beyond this a "quantity" is a misread number (a phone, a PO no.)

_VOWELS = set("aeiou")


class InputError(ValueError):
    """Bad user input. `status_code` is the HTTP status the API should answer with."""

    def __init__(self, message: str, status_code: int = 422):
        super().__init__(message)
        self.status_code = status_code


# --------------------------------------------------------------------------- #
# API-level checks
# --------------------------------------------------------------------------- #

def _looks_like_language(text: str) -> bool:
    """Enough real-looking words to be worth sending to an LLM.

    Rejects binary noise and keyboard mash: at least half the non-space characters
    must be letters, and at least MIN_RFQ_WORDS tokens must look like words
    (alphabetic, 2+ letters, containing a vowel, not one letter repeated)."""
    compact = re.sub(r"\s", "", text)
    if not compact:
        return False
    letters = sum(ch.isalpha() for ch in compact)
    if letters / len(compact) < 0.5:
        return False
    words = [w.lower() for w in re.findall(r"[A-Za-z]+", text)]
    wordlike = [w for w in words if len(w) >= 2 and set(w) & _VOWELS and len(set(w)) > 1]
    return len(wordlike) >= MIN_RFQ_WORDS


def validate_rfq_text(text: Optional[str]) -> str:
    """Return the cleaned RFQ text, or raise InputError explaining what is wrong."""
    cleaned = (text or "").replace("\x00", "").strip()
    if not cleaned:
        raise InputError("The RFQ is empty. Paste the customer's request or upload the RFQ document.")
    if len(cleaned) > MAX_RFQ_CHARS:
        raise InputError(f"The RFQ is {len(cleaned):,} characters; the limit is {MAX_RFQ_CHARS:,}. "
                         "Paste only the request itself, without attachments or email threads.", 413)
    if len(cleaned.split()) < MIN_RFQ_WORDS:
        raise InputError("The RFQ is too short to quote. Include at least the products and quantities.")
    if not _looks_like_language(cleaned):
        raise InputError("The RFQ text does not look like readable language. "
                         "Check that the right file or text was provided.")
    return cleaned


def validate_customer_name(name: Optional[str]) -> str:
    cleaned = " ".join((name or "").split())
    if not cleaned:
        raise InputError("Customer name is required.")
    if len(cleaned) > MAX_CUSTOMER_NAME:
        raise InputError(f"Customer name is longer than {MAX_CUSTOMER_NAME} characters.")
    return cleaned


def validate_upload(filename: Optional[str], content: bytes) -> None:
    """Reject unsupported, empty, oversized, or malicious uploads using signature checks."""
    base_name = os.path.basename(filename or "")
    ext = os.path.splitext(base_name)[1].lower()
    if ext not in ALLOWED_UPLOAD_TYPES:
        allowed = ", ".join(sorted(ALLOWED_UPLOAD_TYPES))
        raise InputError(f"Unsupported file type '{ext or 'none'}'. Upload one of: {allowed}.", 415)
    if not content:
        raise InputError("The uploaded file is empty.")
    if len(content) > MAX_UPLOAD_BYTES:
        raise InputError(f"The file is {len(content) / 1_048_576:.1f} MB; the limit is "
                         f"{MAX_UPLOAD_BYTES // 1_048_576} MB.", 413)

    # Magic-byte signature verification
    if ext == ".pdf":
        if not content.startswith(b"%PDF-"):
            raise InputError("Invalid file signature: Content is not a legitimate PDF document.", 415)
    elif ext == ".docx":
        if not content.startswith(b"PK\x03\x04"):
            raise InputError("Invalid file signature: Content is not a legitimate DOCX document.", 415)
    elif ext in {".txt", ".md", ".csv"}:
        # Reject executable binaries disguised as text (PE / ELF / Mach-O)
        if content.startswith(b"MZ") or content.startswith(b"\x7fELF") or content.startswith(b"\xca\xfe\xba\xbe"):
            raise InputError("Disallowed executable binary file content detected.", 415)
        # Verify text is decodable
        try:
            content.decode("utf-8")
        except UnicodeDecodeError:
            try:
                content.decode("latin-1")
            except Exception:
                raise InputError("File encoding is unsupported or binary content.", 415)


def validate_parsed_upload(text: Optional[str], filename: Optional[str]) -> str:
    """Text read out of an upload. A PDF with no text layer is almost always a scan."""
    if not (text or "").strip():
        hint = " It may be a scanned image; upload a text PDF or paste the text." \
            if (filename or "").lower().endswith(".pdf") else ""
        raise InputError(f"No text could be read from '{filename}'.{hint}")
    return validate_rfq_text(text)


# --------------------------------------------------------------------------- #
# After extraction
# --------------------------------------------------------------------------- #

_RANGE = re.compile(r"(\d[\d,]*)\s*(?:-|–|to|or)\s*(\d[\d,]*)", re.I)
_NUMBER = re.compile(r"\d[\d,]*(?:\.\d+)?")


def coerce_quantity(value: Any) -> Tuple[Optional[int], Optional[str]]:
    """(quantity, note). Quantity is None when it cannot be used as-is; note says why."""
    if isinstance(value, bool) or value is None or value == "":
        return None, "no quantity given"
    if isinstance(value, (int, float)):
        qty = value
    else:
        text = str(value)
        rng = _RANGE.search(text)
        if rng:
            return None, f"quantity given as a range ({rng.group(0)})"
        num = _NUMBER.search(text)
        if not num:
            return None, f"quantity '{text}' is not a number"
        qty = float(num.group(0).replace(",", ""))
    if qty <= 0:
        return None, f"quantity {qty:g} is not positive"
    if qty != int(qty):
        return None, f"quantity {qty:g} is not a whole number"
    if qty > MAX_QUANTITY:
        return None, f"quantity {qty:g} is implausibly large"
    return int(qty), None


def _mentioned(item: Dict[str, Any], raw_text: str) -> bool:
    """True when the RFQ text mentions the product's code, or most of the words in its
    name. One shared generic word is not enough: "Butterfly Valve" is not mentioned by
    an RFQ that only asks for "pressure relief valves"."""
    text = raw_text.lower()
    code = str(item.get("product_code") or "").lower().strip()
    if code and code in text:
        return True
    words = [w[:-1] if w.endswith("s") else w
             for w in re.findall(r"[a-z]{3,}", str(item.get("product_name") or "").lower())]
    if not words:
        return False
    return sum(w in text for w in words) / len(words) >= 0.6


def normalize_requirements(reqs: Dict[str, Any], raw_text: str) -> Tuple[Dict[str, Any], List[str]]:
    """Clean what the Requirement Analysis Agent extracted. Returns (requirements, notes)."""
    reqs = dict(reqs or {})
    items = reqs.get("line_items")
    if not isinstance(items, list):
        items = []
    notes: List[str] = []
    kept: List[Dict[str, Any]] = []
    for raw in items:
        if not isinstance(raw, dict):
            notes.append("dropped a line item that was not a record")
            continue
        item = {k: (v.strip() if isinstance(v, str) else v) for k, v in raw.items()}
        name = item.get("product_name") or item.get("product_code") or ""
        if not name:
            notes.append("dropped a line item with no product name or code")
            continue
        if not _mentioned(item, raw_text):
            notes.append(f"dropped '{name}': the RFQ does not mention it")
            continue
        qty, why = coerce_quantity(item.get("quantity"))
        if why:
            notes.append(f"{name}: {why}")
        item["quantity"] = qty
        kept.append(item)
    reqs["line_items"] = kept
    if notes:
        reqs["normalization_notes"] = notes
    return reqs, notes
