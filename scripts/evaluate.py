"""
SemanticShield — Model Evaluation Script
Evaluates the trained plagiarism classifier and generates a model report.

Usage:
    cd backend
    python ../scripts/evaluate.py

Requires:
    backend/models/plagiarism_model.pkl   (run train.py first)
    backend/data/generated/plagiarism_dataset.csv
"""

import os
import sys
import json
import time
import pickle
import numpy as np
import pandas as pd
from datetime import datetime

# Ensure backend/ is on sys.path
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(SCRIPT_DIR, "..", "backend")
PROJECT_ROOT = os.path.join(SCRIPT_DIR, "..")
sys.path.insert(0, BACKEND_DIR)

from app.feature_extractor import extract_features_batch, FEATURE_NAMES
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix,
)


# ── Paths ─────────────────────────────────────────────────────────
DATASET_PATH = os.path.join(BACKEND_DIR, "data", "generated", "plagiarism_dataset.csv")
MODEL_PATH = os.path.join(BACKEND_DIR, "models", "plagiarism_model.pkl")
METRICS_PATH = os.path.join(BACKEND_DIR, "models", "metrics.json")
REPORT_PATH = os.path.join(PROJECT_ROOT, "docs", "model_report.md")

CLASS_NAMES = ["Original", "Paraphrased", "Plagiarized"]


def main():
    print("=" * 60)
    print("SemanticShield -- Model Evaluation")
    print("=" * 60)

    # ── 1. Load model ─────────────────────────────────────────────
    if not os.path.isfile(MODEL_PATH):
        print(f"ERROR: Model not found at {MODEL_PATH}")
        print("Run  python ../scripts/train.py  first.")
        sys.exit(1)

    with open(MODEL_PATH, "rb") as f:
        clf = pickle.load(f)
    print("Model loaded successfully.")

    # ── 2. Load dataset ───────────────────────────────────────────
    if not os.path.isfile(DATASET_PATH):
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        sys.exit(1)

    df = pd.read_csv(DATASET_PATH)
    print(f"Dataset: {len(df)} samples")

    pairs = list(zip(df["text1"].astype(str).tolist(), df["text2"].astype(str).tolist()))
    labels = df["label"].values

    # ── 3. Extract features ───────────────────────────────────────
    print("Extracting features...")
    t0 = time.time()
    X = extract_features_batch(pairs, show_progress=True)
    feat_time = time.time() - t0
    print(f"Feature extraction: {feat_time:.1f}s")

    # Use same split as training
    _, X_test, _, y_test = train_test_split(
        X, labels, test_size=0.2, random_state=42, stratify=labels
    )
    print(f"Evaluating on {len(X_test)} test samples")

    # ── 4. Predict ────────────────────────────────────────────────
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)

    # ── 5. Metrics ────────────────────────────────────────────────
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted")
    rec = recall_score(y_test, y_pred, average="weighted")
    f1 = f1_score(y_test, y_pred, average="weighted")

    try:
        roc = roc_auc_score(y_test, y_proba, multi_class="ovr", average="weighted")
    except Exception:
        roc = 0.0

    cm = confusion_matrix(y_test, y_pred)

    # Per-class metrics
    prec_per = precision_score(y_test, y_pred, average=None)
    rec_per = recall_score(y_test, y_pred, average=None)
    f1_per = f1_score(y_test, y_pred, average=None)

    print(f"\n{'-' * 50}")
    print(f"  Accuracy:   {acc:.4f}")
    print(f"  Precision:  {prec:.4f}")
    print(f"  Recall:     {rec:.4f}")
    print(f"  F1 Score:   {f1:.4f}")
    print(f"  ROC AUC:    {roc:.4f}")
    print(f"{'-' * 50}")

    print(f"\nClassification Report:\n")
    print(classification_report(y_test, y_pred, target_names=CLASS_NAMES))

    print("Confusion Matrix:")
    print(f"{'':>14s}  {'Pred Orig':>10s}  {'Pred Para':>10s}  {'Pred Plag':>10s}")
    for i, row in enumerate(cm):
        print(f"  {CLASS_NAMES[i]:>12s}  {row[0]:>10d}  {row[1]:>10d}  {row[2]:>10d}")

    # ── 6. Save metrics ───────────────────────────────────────────
    metrics = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "roc_auc": round(roc, 4),
        "confusion_matrix": cm.tolist(),
        "class_names": CLASS_NAMES,
        "per_class": {
            CLASS_NAMES[i]: {
                "precision": round(float(prec_per[i]), 4),
                "recall": round(float(rec_per[i]), 4),
                "f1": round(float(f1_per[i]), 4),
            }
            for i in range(len(CLASS_NAMES))
        },
        "test_samples": len(X_test),
        "evaluated_at": datetime.now().isoformat(),
    }

    # Merge with existing training metrics if available
    if os.path.isfile(METRICS_PATH):
        with open(METRICS_PATH, "r") as f:
            existing = json.load(f)
        existing.update(metrics)
        metrics = existing

    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"\nMetrics saved to {METRICS_PATH}")

    # ── 7. Generate model_report.md ───────────────────────────────
    _generate_report(metrics, cm)
    print(f"Report saved to {REPORT_PATH}")

    print(f"\n{'=' * 60}")
    print("Evaluation complete!")
    print(f"{'=' * 60}")


def _generate_report(metrics: dict, cm: np.ndarray):
    """Generate a comprehensive markdown report."""
    os.makedirs(os.path.dirname(REPORT_PATH), exist_ok=True)

    per_class = metrics.get("per_class", {})
    fi = metrics.get("feature_importances", {})
    cv_mean = metrics.get("cv_accuracy_mean", "N/A")
    cv_std = metrics.get("cv_accuracy_std", "N/A")

    report = f"""# SemanticShield -- Model Evaluation Report

> Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Model Summary

| Property | Value |
|----------|-------|
| Algorithm | RandomForestClassifier |
| Estimators | 300 |
| Max Depth | 20 |
| Features | {metrics.get('feature_count', 8)} |
| Training Samples | {metrics.get('training_samples', 'N/A')} |
| Test Samples | {metrics.get('test_samples', 'N/A')} |
| Total Dataset Size | {metrics.get('total_samples', 'N/A')} |

## Overall Performance

| Metric | Score |
|--------|-------|
| **Accuracy** | {metrics['accuracy']:.4f} |
| **Precision** (weighted) | {metrics['precision']:.4f} |
| **Recall** (weighted) | {metrics['recall']:.4f} |
| **F1 Score** (weighted) | {metrics['f1']:.4f} |
| **ROC AUC** (OvR weighted) | {metrics['roc_auc']:.4f} |
| **CV Accuracy** (5-fold) | {cv_mean} +/- {cv_std} |

## Per-Class Performance

| Class | Precision | Recall | F1 Score |
|-------|-----------|--------|----------|
"""
    for cls_name in CLASS_NAMES:
        cls_data = per_class.get(cls_name, {})
        report += f"| {cls_name} | {cls_data.get('precision', 'N/A')} | {cls_data.get('recall', 'N/A')} | {cls_data.get('f1', 'N/A')} |\n"

    report += f"""
## Confusion Matrix

| | Pred: Original | Pred: Paraphrased | Pred: Plagiarized |
|---|---|---|---|
| **Original** | {cm[0][0]} | {cm[0][1]} | {cm[0][2]} |
| **Paraphrased** | {cm[1][0]} | {cm[1][1]} | {cm[1][2]} |
| **Plagiarized** | {cm[2][0]} | {cm[2][1]} | {cm[2][2]} |

## Feature Importances

| Feature | Importance |
|---------|------------|
"""
    for feat_name, imp in fi.items():
        bar = "#" * int(float(imp) * 40)
        report += f"| {feat_name} | {imp} {bar} |\n"

    report += f"""
## Classification Labels

- **Original (0)**: Text pairs with no meaningful similarity -- unrelated content.
- **Paraphrased (1)**: Text pairs where one is a rephrased version of the other -- same meaning, different words.
- **Plagiarized (2)**: Text pairs where content has been directly copied or minimally edited.

## Notes

- The model uses 8 features combining classical NLP metrics (TF-IDF, Jaccard, n-gram overlap) with neural sentence embeddings (all-MiniLM-L6-v2).
- Cross-validation was performed with 5 folds and stratified sampling.
- Class weights are balanced to handle any class imbalance.
"""

    with open(REPORT_PATH, "w", encoding="utf-8") as f:
        f.write(report)


if __name__ == "__main__":
    main()
