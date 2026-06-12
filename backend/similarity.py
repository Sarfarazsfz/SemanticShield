"""
SemanticShield — Similarity Engine
Core plagiarism detection using TF-IDF and cosine similarity.
Supports multi-document comparison and section analysis.
"""

from typing import Dict, Any, List

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from utils import preprocess_text, extract_sections, compute_text_stats


def detect_plagiarism(
    assignment_text: str,
    sources_dict: Dict[str, str],
    threshold: float = 0.6,
) -> Dict[str, Any]:
    """
    TF-IDF based plagiarism detection pipeline.
    Compares one assignment against multiple source documents.
    """
    if not assignment_text or not sources_dict:
        return _empty_result()

    assign_sentences = preprocess_text(assignment_text)

    # Flatten all source sentences and keep track of origins
    source_sentences: List[str] = []
    source_origins: List[str] = []

    for filename, text in sources_dict.items():
        sents = preprocess_text(text)
        source_sentences.extend(sents)
        source_origins.extend([filename] * len(sents))

    if not assign_sentences or not source_sentences:
        return _empty_result(len(assign_sentences), len(source_sentences))

    # Fit TF-IDF on all sentences
    vectorizer = TfidfVectorizer()
    all_sentences = assign_sentences + source_sentences

    try:
        vectorizer.fit(all_sentences)
        assign_tfidf = vectorizer.transform(assign_sentences)
        source_tfidf = vectorizer.transform(source_sentences)
        sim_matrix = cosine_similarity(assign_tfidf, source_tfidf)
    except Exception as e:
        print(f"Error in TFIDF: {e}")
        return _empty_result(len(assign_sentences), len(source_sentences))

    flagged_sentences = []
    heatmap_data = []
    total_similarity = 0.0

    for i, check_sent in enumerate(assign_sentences):
        row = sim_matrix[i]
        max_sim = float(np.max(row))
        best_match_idx = int(np.argmax(row))
        total_similarity += max_sim

        matched_source_text = (
            source_sentences[best_match_idx] if max_sim >= threshold else None
        )
        matched_filename = (
            source_origins[best_match_idx] if max_sim >= threshold else None
        )

        sentence_data = {
            "index": i,
            "sentence": check_sent,
            "similarity": round(max_sim * 100, 1),
            "is_plagiarized": max_sim >= threshold,
            "matched_source": matched_filename,
            "matched_source_text": matched_source_text,
            "matched_source_index": best_match_idx if max_sim >= threshold else None,
        }

        if max_sim >= threshold:
            flagged_sentences.append(sentence_data)

        shorten_sims = row[: min(30, len(row))]
        heatmap_data.append({
            "check_index": i,
            "check_sentence": check_sent[:80] + ("..." if len(check_sent) > 80 else ""),
            "similarities": [round(float(s) * 100, 1) for s in shorten_sims],
        })

    # Average similarity across all sentences (semantic overlap)
    average_similarity = round((total_similarity / len(assign_sentences)) * 100, 1)

    # Plagiarism percentage based on flagged sentences
    plagiarism_score = round(
        (len(flagged_sentences) / len(assign_sentences)) * 100, 1
    )

    section_analysis = _analyze_sections(
        assignment_text, source_sentences, vectorizer, threshold
    )

    source_text_blob = " ".join(sources_dict.values())

    return {
        # Backward-compatible primary fields
        "similarity_score": plagiarism_score,
        "plagiarism_score": plagiarism_score,
        "average_similarity": average_similarity,
        "plagiarism_detected": len(flagged_sentences) > 0,
        "plagiarized_sentences": flagged_sentences,
        "total_sentences_checked": len(assign_sentences),
        "total_source_sentences": len(source_sentences),
        "flagged_count": len(flagged_sentences),
        "section_analysis": section_analysis,
        "heatmap_data": heatmap_data,
        "source_stats": compute_text_stats(source_text_blob),
        "check_stats": compute_text_stats(assignment_text),
    }


def _analyze_sections(
    assign_text: str,
    source_sentences: List[str],
    vectorizer,
    threshold: float,
) -> List[Dict]:
    sections = extract_sections(assign_text)
    if not source_sentences:
        return []

    try:
        source_tfidf = vectorizer.transform(source_sentences)
    except Exception:
        return []

    results = []
    for sec_name, sec_sents in sections.items():
        if not sec_sents:
            continue

        try:
            sec_tfidf = vectorizer.transform(sec_sents)
            sim_matrix = cosine_similarity(sec_tfidf, source_tfidf)
            max_sims = np.max(sim_matrix, axis=1)
            avg_sim = round(float(np.mean(max_sims)) * 100, 1)
            flagged = int(np.sum(max_sims >= threshold))

            results.append({
                "section": sec_name,
                "similarity": avg_sim,
                "total_sentences": len(sec_sents),
                "flagged_sentences": flagged,
            })
        except Exception:
            pass

    return results


def _empty_result(check_len=0, source_len=0):
    return {
        "similarity_score": 0.0,
        "plagiarism_score": 0.0,
        "average_similarity": 0.0,
        "plagiarism_detected": False,
        "plagiarized_sentences": [],
        "total_sentences_checked": check_len,
        "total_source_sentences": source_len,
        "flagged_count": 0,
        "section_analysis": [],
        "heatmap_data": [],
        "source_stats": {},
        "check_stats": {},
    }


def quick_similarity(text1: str, text2: str) -> Dict[str, Any]:
    return detect_plagiarism(text1, {"source": text2})