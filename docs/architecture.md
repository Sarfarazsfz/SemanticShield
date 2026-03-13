# SemanticShield — System Architecture

## Overview

SemanticShield is an AI-powered semantic plagiarism detection system that uses transformer-based sentence embeddings to detect both exact and paraphrased plagiarism.

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                      User (Browser)                       │
│                                                           │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │  Home Page   │  │  Dashboard   │  │  Report Page    │ │
│  │  (Landing)   │  │  (Analysis)  │  │  (Full Report)  │ │
│  └─────────────┘  └──────┬───────┘  └─────────────────┘ │
│                          │                                │
│            React + Vite + TailwindCSS                     │
└──────────────────────────┬───────────────────────────────┘
                           │ HTTP (axios)
                           │ POST /analyze
                           │ POST /analyze-realtime
                           ▼
┌──────────────────────────────────────────────────────────┐
│                   FastAPI Backend                         │
│                                                           │
│  ┌──────────┐  ┌───────────────┐  ┌───────────────────┐ │
│  │  Routes   │  │  Similarity   │  │  Model Loader     │ │
│  │  (API)    │──│  Engine       │──│  (Singleton)      │ │
│  └──────────┘  └───────────────┘  └───────────────────┘ │
│                       │                     │             │
│                ┌──────┘                     │             │
│                ▼                            ▼             │
│  ┌───────────────────┐  ┌──────────────────────────────┐ │
│  │  Text Utils       │  │  sentence-transformers       │ │
│  │  (Preprocessing)  │  │  all-MiniLM-L6-v2            │ │
│  └───────────────────┘  └──────────────────────────────┘ │
│                                                           │
│  scikit-learn (cosine_similarity)                         │
└──────────────────────────────────────────────────────────┘
```

## Data Flow

1. **User Input** → Paste or upload source text + check text
2. **Frontend** → Sends POST request to `/analyze`
3. **Backend Routes** → Validates input via Pydantic models
4. **Text Utils** → Cleans text, splits into sentences, extracts sections
5. **Model Loader** → Returns cached sentence-transformer model
6. **Similarity Engine** → Generates embeddings → Computes cosine similarity matrix
7. **Detection** → Flags sentences above threshold, computes section analysis
8. **Response** → Returns JSON with score, flagged sentences, heatmap data, section analysis
9. **Frontend** → Renders results with charts, highlights, and interactive report

## Tech Stack

| Layer      | Technology                        |
|------------|-----------------------------------|
| Frontend   | React 19 + Vite                   |
| Styling    | TailwindCSS 3                     |
| Charts     | Recharts                          |
| Animations | Framer Motion                     |
| Backend    | FastAPI + Uvicorn                 |
| NLP Model  | sentence-transformers (MiniLM)    |
| Similarity | scikit-learn (cosine_similarity)  |

## API Endpoints

| Method | Endpoint            | Description                          |
|--------|---------------------|--------------------------------------|
| GET    | `/health`           | Health check                         |
| POST   | `/analyze`          | Full plagiarism analysis             |
| POST   | `/analyze-realtime` | Lightweight real-time similarity     |

### POST /analyze — Request Body

```json
{
  "source_text": "Original reference text...",
  "check_text": "Document to check...",
  "threshold": 0.75
}
```

### POST /analyze — Response

```json
{
  "similarity_score": 76.2,
  "flagged_count": 3,
  "total_sentences_checked": 8,
  "total_source_sentences": 6,
  "plagiarized_sentences": [...],
  "section_analysis": [...],
  "heatmap_data": [...]
}
```
