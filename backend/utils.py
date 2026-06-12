"""
SemanticShield — Text Preprocessing Utilities
Handles text cleaning, sentence splitting, and section extraction.
"""

import os
import re
from typing import List, Dict


def clean_text(text: str) -> str:
    """Remove extra whitespace, normalize text, and strip special chars."""
    if not text:
        return ""
    text = text.strip()
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\w\s.,;:!?'\"()\-\[\]/%]", "", text)
    return text


def split_sentences(text: str) -> List[str]:
    """
    Split text into sentences using a regex-based approach.
    """
    if not text:
        return []

    sentence_pattern = r'(?<=[.!?])\s+(?=[A-Z0-9(])'
    sentences = re.split(sentence_pattern, text)
    sentences = [s.strip() for s in sentences if len(s.strip()) >= 10]
    return sentences


def preprocess_text(text: str) -> List[str]:
    """Clean text and split into sentences."""
    cleaned = clean_text(text)
    return split_sentences(cleaned)


SECTION_PATTERNS = {
    "Introduction": r"(?i)\b(introduction|background|overview)\b",
    "Methodology": r"(?i)\b(methodology|methods|approach|technique)\b",
    "Results": r"(?i)\b(results|findings|outcomes|evaluation)\b",
    "Discussion": r"(?i)\b(discussion|analysis|interpretation)\b",
    "Conclusion": r"(?i)\b(conclusion|summary|final\s+remarks)\b",
}


def extract_sections(text: str) -> Dict[str, List[str]]:
    """
    Attempt to identify academic sections in text.
    Returns a dict mapping section names to their sentences.
    If no sections are detected, all sentences go under 'General'.
    """
    sentences = preprocess_text(text)

    if not sentences:
        return {"General": []}

    sections: Dict[str, List[str]] = {}
    current_section = "General"
    sections[current_section] = []

    for sentence in sentences:
        matched = False
        for section_name, pattern in SECTION_PATTERNS.items():
            if re.search(pattern, sentence):
                current_section = section_name
                sections.setdefault(current_section, [])
                matched = True
                break

        sections.setdefault(current_section, [])
        sections[current_section].append(sentence)

    sections = {k: v for k, v in sections.items() if v}
    return sections if sections else {"General": sentences}


def compute_text_stats(text: str) -> Dict:
    """Return basic statistics about the text."""
    if not text:
        return {
            "total_sentences": 0,
            "total_words": 0,
            "avg_sentence_length": 0.0,
        }

    sentences = preprocess_text(text)
    words = clean_text(text).split()

    return {
        "total_sentences": len(sentences),
        "total_words": len(words),
        "avg_sentence_length": round(len(words) / max(len(sentences), 1), 1),
    }


def extract_text_from_file(file_content: bytes, filename: str) -> str:
    """Extract text from uploaded PDF, DOCX, or TXT file."""
    text = ""
    filename = filename.lower()

    try:
        if filename.endswith(".pdf"):
            import pdfplumber
            from io import BytesIO

            with pdfplumber.open(BytesIO(file_content)) as pdf:
                for page in pdf.pages:
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"

        elif filename.endswith(".docx"):
            import docx
            from io import BytesIO

            doc = docx.Document(BytesIO(file_content))
            for para in doc.paragraphs:
                if para.text:
                    text += para.text + "\n"

        else:
            text = file_content.decode("utf-8-sig", errors="ignore")

    except Exception as e:
        print(f"Error extracting text from {filename}: {e}")
        try:
            text = file_content.decode("utf-8-sig", errors="ignore")
        except Exception:
            text = ""

    return text.strip()


def parse_documents_from_text(text: str) -> Dict[str, str]:
    """
    Parses a single large string into a dict of {filename: content}
    by looking for markers like `[Document: filename]`.
    If no markers exist, treats the whole string as a single source.
    """
    marker_pattern = re.compile(r"\[Document:\s*(.*?)\]")

    parts = marker_pattern.split(text)

    if len(parts) == 1:
        return {"Manual Text Input": text.strip()}

    documents = {}

    pre_text = parts[0].strip()
    if pre_text:
        documents["Manual Text Input"] = pre_text

    for i in range(1, len(parts), 2):
        filename = parts[i].strip()
        content = parts[i + 1].strip() if i + 1 < len(parts) else ""

        if filename in documents:
            documents[filename] += "\n" + content
        else:
            documents[filename] = content

    return documents


def load_reference_corpus(ref_dir: str) -> Dict[str, str]:
    """
    Load all reference documents from a directory into a {filename: text} dict.
    Supports .txt, .pdf, and .docx files.
    Silently skips unreadable files so the system degrades gracefully.
    """
    corpus: Dict[str, str] = {}

    if not os.path.isdir(ref_dir):
        return corpus

    for fname in sorted(os.listdir(ref_dir)):
        fpath = os.path.join(ref_dir, fname)

        if not os.path.isfile(fpath):
            continue

        ext = fname.lower().rsplit(".", 1)[-1] if "." in fname else ""
        if ext not in ("txt", "pdf", "docx"):
            continue

        try:
            with open(fpath, "rb") as fh:
                raw = fh.read()

            text = extract_text_from_file(raw, fname)
            if text.strip():
                corpus[fname] = text.strip()

        except Exception as e:
            print(f"[load_reference_corpus] Skipping {fname}: {e}")

    return corpus