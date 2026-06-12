"""
SemanticShield — API Routes
FastAPI endpoints for ML-powered plagiarism detection.
Includes dataset training, evaluation, and single-document analysis.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import os
import sys
import json
import subprocess
import threading

from similarity import detect_plagiarism, quick_similarity
from utils import (
    extract_text_from_file,
    parse_documents_from_text,
    load_reference_corpus,
    preprocess_text,
)

router = APIRouter()

# ── Paths ──────────────────────────────────────────────────────────
_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
REFERENCE_DOCS_DIR = os.path.join(_BASE_DIR, "reference_docs")
SCRIPTS_DIR = os.path.join(_BASE_DIR, "..", "scripts")
MODELS_DIR = os.path.join(_BASE_DIR, "models")
METRICS_PATH = os.path.join(MODELS_DIR, "metrics.json")


# ── ML Engine (lazy singleton) ────────────────────────────────────
_ml_engine = None


def _get_ml_engine():
    global _ml_engine
    if _ml_engine is None:
        from ml_engine import MLEngine
        _ml_engine = MLEngine()
    return _ml_engine


# ── Request / Response Models ──────────────────────────────────────

class PlagiarismCheckRequest(BaseModel):
    document_text: str = Field(..., description="The document to check for plagiarism")
    threshold: Optional[float] = Field(
        0.60, ge=0.0, le=1.0, description="Similarity threshold (0-1)"
    )


# Legacy model kept for backward-compatibility with /analyze
class AnalyzeRequest(BaseModel):
    source_text: str = Field(
        ..., description="Original/reference text containing all sources"
    )
    target_text: str = Field(
        ..., description="Text to check for plagiarism (assignment)"
    )
    threshold: Optional[float] = Field(
        0.60, ge=0.0, le=1.0, description="Similarity threshold (0-1)"
    )


# ── Helper functions ──────────────────────────────────────────────


def _compute_ai_probability(similarity_score: float, total_sentences: int) -> float:
    """Heuristic AI-generated probability. Capped at 99."""
    return min(round(similarity_score * 0.87), 99)


def _compute_confidence_level(total_sentences: int) -> str:
    if total_sentences >= 6:
        return "High"
    if total_sentences >= 3:
        return "Medium"
    return "Low"


def _build_matched_sources(plagiarized_sentences: List[Dict]) -> List[Dict]:
    """Aggregate per-source statistics from flagged sentences."""
    source_map: Dict[str, Dict] = {}
    for s in plagiarized_sentences:
        src = s.get("matched_source") or "Unknown"
        if src not in source_map:
            source_map[src] = {
                "source": src,
                "matched_sentences": 0,
                "max_similarity": 0.0,
            }
        source_map[src]["matched_sentences"] += 1
        sim = s.get("similarity", 0)
        if sim > source_map[src]["max_similarity"]:
            source_map[src]["max_similarity"] = sim
    return sorted(
        source_map.values(), key=lambda x: x["max_similarity"], reverse=True
    )


def _load_metrics() -> Optional[Dict]:
    """Load metrics.json from disk."""
    if os.path.isfile(METRICS_PATH):
        try:
            with open(METRICS_PATH, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return None


# ── Health ─────────────────────────────────────────────────────────


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    engine = _get_ml_engine()
    corpus = load_reference_corpus(REFERENCE_DOCS_DIR)
    return {
        "status": "healthy",
        "service": "SemanticShield",
        "reference_docs_loaded": len(corpus),
        "ml_model_available": engine.is_model_available(),
    }


# ── File text extraction ───────────────────────────────────────────


@router.post("/extract-text")
async def extract_text(file: UploadFile = File(...)):
    """Extracts text from a single uploaded file (PDF, DOCX, TXT)."""
    try:
        content = await file.read()
        text = extract_text_from_file(content, file.filename)
        return {"text": text, "filename": file.filename}
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"File extraction failed: {str(e)}"
        )


# ══════════════════════════════════════════════════════════════════
#  ML PIPELINE ENDPOINTS
# ══════════════════════════════════════════════════════════════════


@router.post("/train")
async def train_model():
    """
    Trigger the full training pipeline:
      1. Load generated dataset
      2. Extract features
      3. Train RandomForestClassifier
      4. Save model + metrics

    This runs the scripts/train.py script in-process by importing it.
    Returns the metrics on completion.
    """
    dataset_path = os.path.join(_BASE_DIR, "data", "generated", "plagiarism_dataset.csv")
    if not os.path.isfile(dataset_path):
        return JSONResponse(
            status_code=400,
            content={
                "error": "Dataset not found",
                "details": "Run  python scripts/build_dataset.py  first to generate the training dataset.",
            },
        )

    try:
        # Run training script as subprocess so it doesn't block the event loop
        script_path = os.path.join(SCRIPTS_DIR, "train.py")
        result = subprocess.run(
            [sys.executable, script_path],
            cwd=_BASE_DIR,
            capture_output=True,
            text=True,
            timeout=600,  # 10 min timeout
        )

        if result.returncode != 0:
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Training failed",
                    "details": result.stderr[-2000:] if result.stderr else "Unknown error",
                    "stdout": result.stdout[-2000:] if result.stdout else "",
                },
            )

        # Reload model in engine
        engine = _get_ml_engine()
        engine.load_model()

        metrics = _load_metrics()
        return {
            "status": "success",
            "message": "Model trained successfully",
            "metrics": metrics,
            "stdout": result.stdout[-3000:] if result.stdout else "",
        }

    except subprocess.TimeoutExpired:
        return JSONResponse(
            status_code=504,
            content={"error": "Training timed out", "details": "Training exceeded the 10-minute limit."},
        )
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "Training failed", "details": str(e)},
        )


@router.post("/evaluate")
async def evaluate_model():
    """
    Run model evaluation and return metrics + confusion matrix.
    """
    model_path = os.path.join(MODELS_DIR, "plagiarism_model.pkl")
    if not os.path.isfile(model_path):
        return JSONResponse(
            status_code=400,
            content={
                "error": "No trained model found",
                "details": "Run POST /train first.",
            },
        )

    try:
        script_path = os.path.join(SCRIPTS_DIR, "evaluate.py")
        result = subprocess.run(
            [sys.executable, script_path],
            cwd=_BASE_DIR,
            capture_output=True,
            text=True,
            timeout=600,
        )

        if result.returncode != 0:
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Evaluation failed",
                    "details": result.stderr[-2000:] if result.stderr else "Unknown error",
                },
            )

        metrics = _load_metrics()
        return {
            "status": "success",
            "message": "Evaluation complete",
            "metrics": metrics,
        }

    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"error": "Evaluation failed", "details": str(e)},
        )


@router.get("/model-metrics")
async def get_model_metrics():
    """Return saved model metrics without re-running evaluation."""
    metrics = _load_metrics()
    if metrics is None:
        return JSONResponse(
            status_code=404,
            content={"error": "No metrics found", "details": "Train and evaluate the model first."},
        )
    engine = _get_ml_engine()
    return {
        "metrics": metrics,
        "model_available": engine.is_model_available(),
    }


# ══════════════════════════════════════════════════════════════════
#  PRIMARY PLAGIARISM CHECK (ML-Powered)
# ══════════════════════════════════════════════════════════════════


@router.post("/plagiarism-check")
async def plagiarism_check(request: PlagiarismCheckRequest):
    """
    Single-document plagiarism & AI-content analysis.

    Pipeline:
      1. Load reference corpus from backend/reference_docs/
      2. TF-IDF plagiarism detection (baseline)
      3. ML model prediction per sentence (if model is trained)
      4. AI-generated content heuristic
      5. Report generation

    Falls back to TF-IDF only if no trained model is available.
    """
    if not request.document_text or len(request.document_text.strip()) < 10:
        return JSONResponse(
            status_code=400,
            content={
                "error": "Invalid input",
                "details": "document_text must contain at least 10 characters.",
            },
        )

    # ── 1. Load reference corpus ───────────────────────────────────
    sources_dict = load_reference_corpus(REFERENCE_DOCS_DIR)

    if not sources_dict:
        return {
            "plagiarism_score": 0.0,
            "semantic_similarity": 0.0,
            "ai_generated_probability": 0.0,
            "confidence_level": "Low",
            "flagged_sentences": [],
            "section_analysis": [],
            "matched_sources": [],
            "total_sentences_checked": 0,
            "total_source_sentences": 0,
            "flagged_count": 0,
            "similarity_score": 0.0,
            "plagiarized_sentences": [],
            "heatmap_data": [],
            "source_stats": {},
            "check_stats": {},
            "warning": "No reference documents found in backend/reference_docs/.",
        }

    try:
        # ── 2. TF-IDF baseline detection ──────────────────────────
        result = detect_plagiarism(
            assignment_text=request.document_text,
            sources_dict=sources_dict,
            threshold=request.threshold,
        )

        plagiarized = result.get("plagiarized_sentences", [])
        total_checked = result.get("total_sentences_checked", 0)
        similarity_score = result.get("similarity_score", 0.0)

        # ── 3. ML model classification per sentence ───────────────
        engine = _get_ml_engine()
        model_metrics = engine.get_metrics()

        # Build per-sentence ML predictions
        doc_sentences = preprocess_text(request.document_text)

        # Flatten reference sentences for pairing
        ref_sentences = []
        for _, text in sources_dict.items():
            ref_sentences.extend(preprocess_text(text))

        ml_predictions = {}
        if engine.ensure_loaded() and doc_sentences and ref_sentences:
            # For each document sentence, pair it with its best TF-IDF match
            # from the heatmap data to get a single pair for ML classification
            import numpy as np
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity as sk_cos

            try:
                vectorizer = TfidfVectorizer()
                all_sents = doc_sentences + ref_sentences
                vectorizer.fit(all_sents)
                doc_tfidf = vectorizer.transform(doc_sentences)
                ref_tfidf = vectorizer.transform(ref_sentences)
                sim_matrix = sk_cos(doc_tfidf, ref_tfidf)

                pairs_for_ml = []
                for i, sent in enumerate(doc_sentences):
                    best_idx = int(np.argmax(sim_matrix[i]))
                    pairs_for_ml.append((sent, ref_sentences[best_idx]))

                predictions = engine.predict_batch(pairs_for_ml)

                for i, pred in enumerate(predictions):
                    ml_predictions[i] = pred
            except Exception as e:
                print(f"[routes] ML prediction failed, using baseline: {e}")

        # ── 4. AI probability & confidence ────────────────────────
        ai_prob = _compute_ai_probability(similarity_score, total_checked)
        confidence = _compute_confidence_level(total_checked)

        # ── 5. Build response ──────────────────────────────────────
        flagged_sentences = []
        for s in plagiarized:
            idx = s.get("index", 0)
            ml_pred = ml_predictions.get(idx, {})

            entry = {
                "sentence": s["sentence"],
                "similarity": round(s["similarity"] / 100, 4),
                "status": "Plagiarized" if s["is_plagiarized"] else "Similar",
                "matched_source": s.get("matched_source"),
                "matched_source_text": s.get("matched_source_text"),
            }

            # Add ML classification if available
            if ml_pred:
                entry["classification"] = ml_pred.get("classification", "Unknown")
                entry["classification_confidence"] = ml_pred.get("confidence", 0.0)
                entry["probabilities"] = ml_pred.get("probabilities", {})

            flagged_sentences.append(entry)

        # Also build full sentence list with ML classifications
        all_sentences_classified = []
        for i, sent in enumerate(doc_sentences):
            ml_pred = ml_predictions.get(i, {})
            # Find if this sentence is in the flagged list
            hm = result.get("heatmap_data", [])
            max_sim = 0.0
            if i < len(hm):
                max_sim = max(hm[i].get("similarities", [0]))

            entry = {
                "index": i,
                "sentence": sent,
                "similarity": round(max_sim, 1),
                "classification": ml_pred.get("classification", "Original"),
                "classification_confidence": ml_pred.get("confidence", 0.0),
                "is_plagiarized": max_sim >= (request.threshold * 100),
            }
            all_sentences_classified.append(entry)

        matched_sources = _build_matched_sources(plagiarized)

        # Enrich legacy plagiarized_sentences with ML classification
        # so SentenceBreakdown can display them
        for s in plagiarized:
            idx = s.get("index", 0)
            ml_pred = ml_predictions.get(idx, {})
            if ml_pred:
                s["classification"] = ml_pred.get("classification", "Unknown")
                s["confidence"] = round(ml_pred.get("confidence", 0.0) * 100, 1)

        response = {
            # New canonical fields
            "plagiarism_score": similarity_score,
            "semantic_similarity": round(similarity_score / 100, 4),
            "ai_generated_probability": ai_prob,
            "confidence_level": confidence,
            "flagged_sentences": flagged_sentences,
            "section_analysis": result.get("section_analysis", []),
            "matched_sources": matched_sources,
            "all_sentences_classified": all_sentences_classified,
            # Legacy fields for report components
            "similarity_score": similarity_score,
            "plagiarized_sentences": plagiarized,
            "total_sentences_checked": total_checked,
            "total_source_sentences": result.get("total_source_sentences", 0),
            "flagged_count": result.get("flagged_count", 0),
            "heatmap_data": result.get("heatmap_data", []),
            "source_stats": result.get("source_stats", {}),
            "check_stats": result.get("check_stats", {}),
            "plagiarism_type": "ML + Semantic Plagiarism Detection",
            "is_plagiarism_only": False,
        }

        # Add model metrics if available
        if model_metrics:
            response["model_metrics"] = {
                "accuracy": model_metrics.get("accuracy"),
                "precision": model_metrics.get("precision"),
                "recall": model_metrics.get("recall"),
                "f1": model_metrics.get("f1"),
                "roc_auc": model_metrics.get("roc_auc"),
                "confusion_matrix": model_metrics.get("confusion_matrix"),
                "class_names": model_metrics.get("class_names"),
            }

        return response

    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"error": "Analysis failed", "details": str(e)},
        )


# ══════════════════════════════════════════════════════════════════
#  LEGACY ENDPOINTS (backward-compat)
# ══════════════════════════════════════════════════════════════════


@router.post("/analyze")
async def analyze_documents(request: AnalyzeRequest):
    """Legacy full-analysis endpoint (two-document comparison)."""
    if not request.source_text or not request.target_text:
        return JSONResponse(
            status_code=400,
            content={
                "error": "Analysis failed",
                "details": "Both documents are required",
            },
        )

    try:
        sources_dict = parse_documents_from_text(request.source_text)
        result = detect_plagiarism(
            assignment_text=request.target_text,
            sources_dict=sources_dict,
            threshold=request.threshold,
        )
        result["plagiarism_type"] = "Semantic Similarity"
        return result
    except Exception:
        return JSONResponse(
            status_code=500,
            content={
                "error": "Analysis failed",
                "details": "Model not loaded or invalid input",
            },
        )


@router.post("/analyze-realtime")
async def analyze_realtime(text1: str = Form(...), text2: str = Form(...)):
    """Lightweight real-time similarity check."""
    try:
        result = quick_similarity(text1=text1, text2=text2)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Realtime analysis failed: {str(e)}"
        )
