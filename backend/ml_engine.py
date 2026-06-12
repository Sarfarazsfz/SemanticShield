"""
SemanticShield — ML Engine
Wraps the trained RandomForest model for inference.
Provides per-sentence classification: Original / Paraphrased / Plagiarized.
Falls back to TF-IDF heuristic when no trained model is available.
"""

import os
import json
import pickle
import sys
from typing import Dict, List, Any, Optional, Tuple

import numpy as np

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if _BASE_DIR not in sys.path:
    sys.path.insert(0, _BASE_DIR)

# Robust import path: works whether feature_extractor sits under app/ or backend/
try:
    from app.feature_extractor import (
        extract_features,
        extract_features_batch,
        FEATURE_NAMES,
        tfidf_cosine_similarity,
    )
except ImportError:
    from feature_extractor import (
        extract_features,
        extract_features_batch,
        FEATURE_NAMES,
        tfidf_cosine_similarity,
    )

MODEL_PATH = os.path.join(_BASE_DIR, "models", "plagiarism_model.pkl")
METRICS_PATH = os.path.join(_BASE_DIR, "models", "metrics.json")

CLASS_LABELS = {0: "Original", 1: "Paraphrased", 2: "Plagiarized"}


class MLEngine:
    """
    Manages model loading, prediction, and per-sentence classification.
    Thread-safe: model is loaded once and reused.
    """

    def __init__(self):
        self._model = None
        self._metrics: Optional[Dict] = None
        self._loaded = False

    def is_model_available(self) -> bool:
        """Check if a trained model file exists on disk."""
        return os.path.isfile(MODEL_PATH)

    def load_model(self) -> bool:
        """Load the model from disk. Returns True on success."""
        if not self.is_model_available():
            return False

        try:
            with open(MODEL_PATH, "rb") as f:
                self._model = pickle.load(f)

            self._loaded = True
            self._load_metrics()
            return True

        except Exception as e:
            print(f"[MLEngine] Failed to load model: {e}")
            self._model = None
            self._loaded = False
            return False

    def _load_metrics(self):
        """Load saved training metrics if available."""
        if os.path.isfile(METRICS_PATH):
            try:
                with open(METRICS_PATH, "r") as f:
                    self._metrics = json.load(f)
            except Exception:
                self._metrics = None

    def get_metrics(self) -> Optional[Dict]:
        """Return model metrics (accuracy, precision, recall, etc.)."""
        if self._metrics is None:
            self._load_metrics()
        return self._metrics

    def ensure_loaded(self) -> bool:
        """Ensure model is loaded; load lazily if needed."""
        if self._loaded and self._model is not None:
            return True
        return self.load_model()

    def predict_pair(self, text1: str, text2: str) -> Dict[str, Any]:
        """
        Classify a single text pair.
        Returns:
            {
                label: int,
                classification: str,
                confidence: float,
                probabilities: dict,
                features: dict
            }
        """
        if not self.ensure_loaded():
            return self._fallback_predict(text1, text2)

        features = extract_features(text1, text2)
        features_2d = features.reshape(1, -1)

        label = int(self._model.predict(features_2d)[0])
        probas = self._model.predict_proba(features_2d)[0]
        confidence = float(probas[label])

        return {
            "label": label,
            "classification": CLASS_LABELS.get(label, "Unknown"),
            "confidence": round(confidence, 4),
            "probabilities": {
                CLASS_LABELS[i]: round(float(p), 4)
                for i, p in enumerate(probas)
            },
            "features": {
                name: round(float(val), 4)
                for name, val in zip(FEATURE_NAMES, features)
            },
        }

    def predict_batch(
        self, pairs: List[Tuple[str, str]], show_progress: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Classify a batch of text pairs efficiently.
        Uses batch feature computation for speed.
        """
        if not pairs:
            return []

        if not self.ensure_loaded():
            return [self._fallback_predict(t1, t2) for t1, t2 in pairs]

        features_matrix = extract_features_batch(pairs, show_progress=show_progress)
        labels = self._model.predict(features_matrix)
        probas = self._model.predict_proba(features_matrix)

        results = []
        for i, (t1, t2) in enumerate(pairs):
            label = int(labels[i])
            prob = probas[i]
            confidence = float(prob[label])

            results.append({
                "label": label,
                "classification": CLASS_LABELS.get(label, "Unknown"),
                "confidence": round(confidence, 4),
                "probabilities": {
                    CLASS_LABELS[j]: round(float(p), 4)
                    for j, p in enumerate(prob)
                },
                "features": {
                    name: round(float(val), 4)
                    for name, val in zip(FEATURE_NAMES, features_matrix[i])
                },
            })

        return results

    def _fallback_predict(self, text1: str, text2: str) -> Dict[str, Any]:
        """
        Heuristic classification when no trained model is available.
        Uses TF-IDF cosine similarity thresholds.
        """
        sim = tfidf_cosine_similarity(text1, text2)

        if sim >= 0.8:
            label, cls = 2, "Plagiarized"
        elif sim >= 0.5:
            label, cls = 1, "Paraphrased"
        else:
            label, cls = 0, "Original"

        return {
            "label": label,
            "classification": cls,
            "confidence": round(sim if label > 0 else (1.0 - sim), 4),
            "probabilities": {
                "Original": round(max(0, 1.0 - sim), 4),
                "Paraphrased": round(min(sim, 0.5), 4),
                "Plagiarized": round(max(0, sim - 0.5), 4),
            },
            "features": {"tfidf_cosine": round(sim, 4)},
            "fallback": True,
        }


engine = MLEngine()