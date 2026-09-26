import os
from typing import Dict, Any
from app.core.logging import logger

def parse_document(file_path: str, filename: str) -> str:
    """Parses document contents based on extension."""
    ext = os.path.splitext(filename)[1].lower()
    text_content = ""
    
    try:
        if ext == ".pdf":
            import pypdf
            reader = pypdf.PdfReader(file_path)
            pages_text = []
            for i, page in enumerate(reader.pages):
                extracted = page.extract_text() or ""
                pages_text.append(f"--- Page {i+1} ---\n{extracted}")
            text_content = "\n\n".join(pages_text)

        elif ext == ".docx":
            import docx
            doc = docx.Document(file_path)
            paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
            text_content = "\n".join(paragraphs)

        elif ext == ".csv":
            import pandas as pd
            df = pd.read_csv(file_path)
            text_content = df.to_string()

        elif ext in [".txt", ".md"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text_content = f.read()

        else:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                text_content = f.read()
                
    except Exception as e:
        logger.error(f"Error parsing document {filename}: {e}")
        text_content = f"Failed to parse content for {filename}: {str(e)}"
        
    return text_content
