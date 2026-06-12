# SemanticShield -- Model Evaluation Report

> Generated: 2026-06-12 20:19:05

## Model Summary

| Property | Value |
|----------|-------|
| Algorithm | RandomForestClassifier |
| Estimators | 300 |
| Max Depth | 20 |
| Features | 8 |
| Training Samples | 12000 |
| Test Samples | 3000 |
| Total Dataset Size | 15000 |

## Overall Performance

| Metric | Score |
|--------|-------|
| **Accuracy** | 0.9430 |
| **Precision** (weighted) | 0.9451 |
| **Recall** (weighted) | 0.9430 |
| **F1 Score** (weighted) | 0.9429 |
| **ROC AUC** (OvR weighted) | 0.9936 |
| **CV Accuracy** (5-fold) | 0.9459 +/- 0.0023 |

## Per-Class Performance

| Class | Precision | Recall | F1 Score |
|-------|-----------|--------|----------|
| Original | 1.0 | 1.0 | 1.0 |
| Paraphrased | 0.954 | 0.871 | 0.9106 |
| Plagiarized | 0.8813 | 0.958 | 0.9181 |

## Confusion Matrix

| | Pred: Original | Pred: Paraphrased | Pred: Plagiarized |
|---|---|---|---|
| **Original** | 1000 | 0 | 0 |
| **Paraphrased** | 0 | 871 | 129 |
| **Plagiarized** | 0 | 42 | 958 |

## Feature Importances

| Feature | Importance |
|---------|------------|
| bigram_overlap | 0.2139 ######## |
| word_overlap | 0.206 ######## |
| trigram_overlap | 0.192 ####### |
| tfidf_cosine | 0.1452 ##### |
| jaccard | 0.1402 ##### |
| length_ratio | 0.068 ## |
| char_overlap | 0.0347 # |
| embedding_cosine | 0.0  |

## Classification Labels

- **Original (0)**: Text pairs with no meaningful similarity -- unrelated content.
- **Paraphrased (1)**: Text pairs where one is a rephrased version of the other -- same meaning, different words.
- **Plagiarized (2)**: Text pairs where content has been directly copied or minimally edited.

## Notes

- The model uses 8 features combining classical NLP metrics (TF-IDF, Jaccard, n-gram overlap) with neural sentence embeddings (all-MiniLM-L6-v2).
- Cross-validation was performed with 5 folds and stratified sampling.
- Class weights are balanced to handle any class imbalance.
