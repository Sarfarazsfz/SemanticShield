"""
SemanticShield — API Routes
FastAPI endpoints for multi-document plagiarism detection.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from typing import List, Optional
from similarity import detect_plagiarism, quick_similarity
from utils import extract_text_from_file, parse_documents_from_text

router = APIRouter()

# ── Request / Response Models ──────────────────────────────────────

from fastapi.responses import JSONResponse

class AnalyzeRequest(BaseModel):
    source_text: str = Field(..., description="Original/reference text containing all sources")
    target_text: str = Field(..., description="Text to check for plagiarism (assignment)")
    threshold: Optional[float] = Field(0.60, ge=0.0, le=1.0, description="Similarity threshold (0-1)")

@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "SemanticShield"}


@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """
    Extracts text from a single uploaded file (PDF, DOCX, TXT).
    Returns the raw string to populate the frontend textarea.
    """
    try:
        content = await file.read()
        text = extract_text_from_file(content, file.filename)
        return {"text": text, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File extraction failed: {str(e)}")


@router.post("/analyze")
async def analyze_documents(request: AnalyzeRequest):
    """
    Full plagiarism analysis from textareas.
    Parses `[Document: filename]` markers to split reference text back into multiple sources.
    """
    if not request.source_text or not request.target_text:
        return JSONResponse(
            status_code=400, 
            content={"error": "Analysis failed", "details": "Both documents are required"}
        )

    try:
        # Parse source_text into separate documents for source matching
        sources_dict = parse_documents_from_text(request.source_text)

        result = detect_plagiarism(
            assignment_text=request.target_text,
            sources_dict=sources_dict,
            threshold=request.threshold,
        )
        
        # Add exact string demanded by user
        result["plagiarism_type"] = "Semantic Similarity"
        
        return result
    except Exception as e:
        return JSONResponse(
            status_code=500, 
            content={"error": "Analysis failed", "details": "Model not loaded or invalid input"}
        )


@router.post("/analyze-realtime")
async def analyze_realtime(text1: str = Form(...), text2: str = Form(...)):
    """
    Lightweight real-time similarity check.
    """
    try:
        result = quick_similarity(text1=text1, text2=text2)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Realtime analysis failed: {str(e)}")
