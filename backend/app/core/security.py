import os
from fastapi import HTTPException, status, UploadFile

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt", ".csv", ".md"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit

def validate_uploaded_file(file: UploadFile):
    filename = file.filename or ""
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    return True
