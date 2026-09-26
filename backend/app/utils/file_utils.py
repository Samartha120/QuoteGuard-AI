import os
import uuid

UPLOAD_DIR = os.path.abspath("./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_uploaded_file(file_content: bytes, original_filename: str) -> str:
    """Saves uploaded binary file content to uploads directory with unique prefix."""
    ext = os.path.splitext(original_filename)[1]
    safe_name = f"{uuid.uuid4().hex[:8]}_{original_filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_name)
    with open(file_path, "wb") as f:
        f.write(file_content)
    return file_path
