"""
SemanticShield — Feature Extractor
Extracts numerical features from text pairs for ML-based plagiarism classification.

Features:
    1. TF-IDF cosine similarity
    2. Jaccard similarity
    3. Word overlap ratio
    4. Character overlap ratio
    5. Sentence length ratio
    6. Common bigram ratio
    7. Common trigram ratio
    8. Embedding cosine similarity (sentence-transformers)
"""

import re
import math
import numpy as np
from typing import List, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity as sk_cosine

# ── Lazy-loaded embedding model ───────────────────────────────────
_embedding_model = None


def _get_embedding_model():
    """Lazy-load sentence-transformers model (first call downloads ~80 MB)."""
    global _embedding_model
    if _embedding_model is None:
        from sentence_transformers import SentenceTransformer
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model


# ── Text helpers ──────────────────────────────────────────────────

def _tokenize(text: str) -> List[str]:
    """Lowercase whitespace tokenizer with basic punctuation removal."""
    return re.findall(r"\b\w+\b", text.lower())


def _char_set(text: str) -> set:
    return set(text.lower().replace(" ", ""))


def _ngrams(tokens: List[str], n: int) -> set:
    """Return the set of n-grams from a token list."""
    if len(tokens) < n:
        return set()
    return {tuple(tokens[i : i + n]) for i in range(len(tokens) - n + 1)}


# ── Individual feature functions ──────────────────────────────────

def tfidf_cosine_similarity(text1: str, text2: str) -> float:
    """TF-IDF cosine similarity between two texts."""
    try:
        vectorizer = TfidfVectorizer()
        tfidf = vectorizer.fit_transform([text1, text2])
        sim = sk_cosine(tfidf[0:1], tfidf[1:2])[0][0]
        return float(sim)
    except Exception:
        return 0.0


def jaccard_similarity(text1: str, text2: str) -> float:
    """Jaccard index over word sets."""
    w1 = set(_tokenize(text1))
    w2 = set(_tokenize(text2))
    if not w1 and not w2:
        return 0.0
    intersection = w1 & w2
    union = w1 | w2
    return len(intersection) / len(union) if union else 0.0


def word_overlap_ratio(text1: str, text2: str) -> float:
    """Fraction of words in text1 that also appear in text2."""
    w1 = set(_tokenize(text1))
    w2 = set(_tokenize(text2))
    if not w1:
        return 0.0
    return len(w1 & w2) / len(w1)


def char_overlap_ratio(text1: str, text2: str) -> float:
    """Fraction of unique characters in text1 also present in text2."""
    c1 = _char_set(text1)
    c2 = _char_set(text2)
    if not c1:
        return 0.0
    return len(c1 & c2) / len(c1)


def sentence_length_ratio(text1: str, text2: str) -> float:
    """Ratio of the shorter sentence to the longer (word count)."""
    l1 = len(_tokenize(text1))
    l2 = len(_tokenize(text2))
    if max(l1, l2) == 0:
        return 0.0
    return min(l1, l2) / max(l1, l2)


def common_bigram_ratio(text1: str, text2: str) -> float:
    """Fraction of bigrams in text1 that appear in text2."""
    t1 = _tokenize(text1)
    t2 = _tokenize(text2)
    bg1 = _ngrams(t1, 2)
    bg2 = _ngrams(t2, 2)
    if not bg1:
        return 0.0
    return len(bg1 & bg2) / len(bg1)


def common_trigram_ratio(text1: str, text2: str) -> float:
    """Fraction of trigrams in text1 that appear in text2."""
    t1 = _tokenize(text1)
    t2 = _tokenize(text2)
    tg1 = _ngrams(t1, 3)
    tg2 = _ngrams(t2, 3)
    if not tg1:
        return 0.0
    return len(tg1 & tg2) / len(tg1)


def embedding_cosine_similarity(text1: str, text2: str) -> float:
    """Cosine similarity between sentence-transformer embeddings."""
    try:
        model = _get_embedding_model()
        embs = model.encode([text1, text2], convert_to_numpy=True)
        # Cosine similarity
        dot = np.dot(embs[0], embs[1])
        norm = np.linalg.norm(embs[0]) * np.linalg.norm(embs[1])
        return float(dot / norm) if norm > 0 else 0.0
    except Exception:
        return 0.0


# ── Main extraction function ─────────────────────────────────────

FEATURE_NAMES = [
    "tfidf_cosine",
    "jaccard",
    "word_overlap",
    "char_overlap",
    "length_ratio",
    "bigram_overlap",
    "trigram_overlap",
    "embedding_cosine",
]


def extract_features(text1: str, text2: str) -> np.ndarray:
    """
    Extract the full 8-feature vector from a pair of texts.
    Returns a 1-D numpy array of shape (8,).
    """
    features = [
        tfidf_cosine_similarity(text1, text2),
        jaccard_similarity(text1, text2),
        word_overlap_ratio(text1, text2),
        char_overlap_ratio(text1, text2),
        sentence_length_ratio(text1, text2),
        common_bigram_ratio(text1, text2),
        common_trigram_ratio(text1, text2),
        embedding_cosine_similarity(text1, text2),
    ]
    return np.array(features, dtype=np.float64)


def extract_features_batch(
    pairs: List[Tuple[str, str]], show_progress: bool = False
) -> np.ndarray:
    """
    Extract features for a list of (text1, text2) pairs.
    Returns a 2-D numpy array of shape (N, 8).
    """
    n = len(pairs)
    result = np.zeros((n, len(FEATURE_NAMES)), dtype=np.float64)

    # Pre-compute classical features
    for i, (t1, t2) in enumerate(pairs):
        result[i, 0] = tfidf_cosine_similarity(t1, t2)
        result[i, 1] = jaccard_similarity(t1, t2)
        result[i, 2] = word_overlap_ratio(t1, t2)
        result[i, 3] = char_overlap_ratio(t1, t2)
        result[i, 4] = sentence_length_ratio(t1, t2)
        result[i, 5] = common_bigram_ratio(t1, t2)
        result[i, 6] = common_trigram_ratio(t1, t2)

        if show_progress and (i + 1) % 500 == 0:
            print(f"  Classical features: {i + 1}/{n}")

    # Batch-compute embeddings for efficiency
    try:
        model = _get_embedding_model()
        texts_a = [p[0] for p in pairs]
        texts_b = [p[1] for p in pairs]

        if show_progress:
            print(f"  Encoding {n} text-A embeddings...")
        embs_a = model.encode(texts_a, batch_size=128, show_progress_bar=show_progress, convert_to_numpy=True)

        if show_progress:
            print(f"  Encoding {n} text-B embeddings...")
        embs_b = model.encode(texts_b, batch_size=128, show_progress_bar=show_progress, convert_to_numpy=True)

        # Row-wise cosine similarity
        dots = np.sum(embs_a * embs_b, axis=1)
        norms = np.linalg.norm(embs_a, axis=1) * np.linalg.norm(embs_b, axis=1)
        norms = np.where(norms == 0, 1.0, norms)
        result[:, 7] = dots / norms

    except Exception as e:
        print(f"  Warning: Embedding computation failed ({e}), using 0.0 fallback")
        result[:, 7] = 0.0

    return result
