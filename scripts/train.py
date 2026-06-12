"""
SemanticShield — Model Training Script
Trains a RandomForestClassifier on the generated plagiarism dataset.

Usage:
    cd backend
    python ../scripts/train.py

Requires:
    backend/data/generated/plagiarism_dataset.csv  (run build_dataset.py first)
"""

import os
import sys
import json
import time
import pickle
import numpy as np
import pandas as pd

# Ensure backend/ is on sys.path so we can import app.feature_extractor
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(SCRIPT_DIR, "..", "backend")
sys.path.insert(0, BACKEND_DIR)

from app.feature_extractor import extract_features_batch, FEATURE_NAMES
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)


# ── Paths ─────────────────────────────────────────────────────────
DATASET_PATH = os.path.join(BACKEND_DIR, "data", "generated", "plagiarism_dataset.csv")
MODEL_DIR = os.path.join(BACKEND_DIR, "models")
MODEL_PATH = os.path.join(MODEL_DIR, "plagiarism_model.pkl")
METRICS_PATH = os.path.join(MODEL_DIR, "metrics.json")

CLASS_NAMES = ["Original", "Paraphrased", "Plagiarized"]


def load_dataset():
    """Load and validate the CSV dataset."""
    if not os.path.isfile(DATASET_PATH):
        print(f"ERROR: Dataset not found at {DATASET_PATH}")
        print("Run  python ../scripts/build_dataset.py  first.")
        sys.exit(1)

    df = pd.read_csv(DATASET_PATH)
    print(f"Loaded dataset: {len(df)} rows")
    print(f"Label distribution:\n{df['label'].value_counts().sort_index()}")
    return df


def main():
    print("=" * 60)
    print("SemanticShield -- Model Training")
    print("=" * 60)

    # ── 1. Load data ──────────────────────────────────────────────
    df = load_dataset()

    pairs = list(zip(df["text1"].astype(str).tolist(), df["text2"].astype(str).tolist()))
    labels = df["label"].values

    # ── 2. Extract features ───────────────────────────────────────
    print(f"\nExtracting {len(FEATURE_NAMES)} features for {len(pairs)} pairs...")
    t0 = time.time()
    X = extract_features_batch(pairs, show_progress=True)
    feat_time = time.time() - t0
    print(f"Feature extraction complete in {feat_time:.1f}s")
    print(f"Feature matrix shape: {X.shape}")

    y = labels

    # ── 3. Train/test split ───────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"\nTrain set: {len(X_train)} samples")
    print(f"Test  set: {len(X_test)} samples")

    # ── 4. Train RandomForest ─────────────────────────────────────
    print("\nTraining RandomForestClassifier...")
    print("  n_estimators=300, max_depth=20, random_state=42")
    t0 = time.time()

    clf = RandomForestClassifier(
        n_estimators=300,
        max_depth=20,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )
    clf.fit(X_train, y_train)
    train_time = time.time() - t0
    print(f"Training complete in {train_time:.1f}s")

    # ── 5. Evaluate on test set ───────────────────────────────────
    y_pred = clf.predict(X_test)
    y_proba = clf.predict_proba(X_test)

    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, average="weighted")
    rec = recall_score(y_test, y_pred, average="weighted")
    f1 = f1_score(y_test, y_pred, average="weighted")

    # ROC AUC (one-vs-rest)
    from sklearn.metrics import roc_auc_score
    try:
        roc = roc_auc_score(y_test, y_proba, multi_class="ovr", average="weighted")
    except Exception:
        roc = 0.0

    cm = confusion_matrix(y_test, y_pred).tolist()

    print(f"\n{'-' * 40}")
    print(f"Test Results:")
    print(f"  Accuracy:  {acc:.4f}")
    print(f"  Precision: {prec:.4f}")
    print(f"  Recall:    {rec:.4f}")
    print(f"  F1 Score:  {f1:.4f}")
    print(f"  ROC AUC:   {roc:.4f}")
    print(f"\nConfusion Matrix:")
    for i, row in enumerate(cm):
        print(f"  {CLASS_NAMES[i]:>12s}: {row}")
    print(f"{'-' * 40}")

    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=CLASS_NAMES))

    # ── 6. Cross-validation ───────────────────────────────────────
    print("Running 5-fold cross-validation...")
    cv_scores = cross_val_score(clf, X, y, cv=5, scoring="accuracy", n_jobs=-1)
    print(f"  CV Accuracy: {cv_scores.mean():.4f} +/- {cv_scores.std():.4f}")
    print(f"  Fold scores: {[round(s, 4) for s in cv_scores]}")

    # ── 7. Feature importances ────────────────────────────────────
    importances = clf.feature_importances_
    importance_dict = {
        name: round(float(imp), 4)
        for name, imp in sorted(
            zip(FEATURE_NAMES, importances), key=lambda x: x[1], reverse=True
        )
    }
    print(f"\nFeature importances:")
    for name, imp in importance_dict.items():
        bar = "#" * int(imp * 50)
        print(f"  {name:>20s}: {imp:.4f} {bar}")

    # ── 8. Save model ─────────────────────────────────────────────
    os.makedirs(MODEL_DIR, exist_ok=True)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(clf, f)
    print(f"\nModel saved to {MODEL_PATH}")

    # ── 9. Save metrics ──────────────────────────────────────────
    metrics = {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "roc_auc": round(roc, 4),
        "confusion_matrix": cm,
        "class_names": CLASS_NAMES,
        "cv_accuracy_mean": round(float(cv_scores.mean()), 4),
        "cv_accuracy_std": round(float(cv_scores.std()), 4),
        "cv_fold_scores": [round(float(s), 4) for s in cv_scores],
        "feature_importances": importance_dict,
        "training_samples": len(X_train),
        "test_samples": len(X_test),
        "total_samples": len(X),
        "feature_count": len(FEATURE_NAMES),
        "feature_names": FEATURE_NAMES,
        "training_time_seconds": round(train_time, 2),
        "feature_extraction_time_seconds": round(feat_time, 2),
    }

    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to {METRICS_PATH}")

    print(f"\n{'=' * 60}")
    print("Training pipeline complete!")
    print(f"{'=' * 60}")


if __name__ == "__main__":
    main()
