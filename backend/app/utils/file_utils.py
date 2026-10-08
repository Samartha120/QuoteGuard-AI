import os
import uuid
import re
from fastapi import HTTPException

UPLOAD_DIR = os.path.abspath("./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md", ".csv"}


def sanitize_filename(original_filename: str) -> str:
    """Sanitizes client-provided filename, rejecting disallowed extensions and path traversal."""
    base = os.path.basename(original_filename or "upload")
    # Remove any directory separator characters or relative path components
    base = base.replace("/", "").replace("\\", "").replace("..", "")
    
    name, ext = os.path.splitext(base)
    ext_clean = ext.lower()
    
    if ext_clean not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported or dangerous file extension '{ext_clean}'.",
        )

    clean_name = re.sub(r"[^a-zA-Z0-9_\-]", "_", name)[:64]
    return f"{uuid.uuid4().hex}_{clean_name or 'file'}{ext_clean}"


def save_uploaded_file(file_content: bytes, original_filename: str) -> str:
    """Validates file size, checks destination path, and saves uploaded content securely."""
    if len(file_content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024*1024)} MB.",
        )

    safe_filename = sanitize_filename(original_filename)
    file_path = os.path.abspath(os.path.join(UPLOAD_DIR, safe_filename))

    if not file_path.startswith(UPLOAD_DIR):
        raise HTTPException(status_code=400, detail="Invalid file destination path detected.")

    with open(file_path, "wb") as f:
        f.write(file_content)
    return file_path
