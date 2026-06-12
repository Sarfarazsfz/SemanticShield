# SemanticShield

> AI-Powered Semantic Plagiarism Detection System built using Machine Learning, FastAPI, React, and NLP techniques.

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-Backend-green)
![React](https://img.shields.io/badge/React-Frontend-blue)
![Machine Learning](https://img.shields.io/badge/Machine-Learning-orange)
![License](https://img.shields.io/badge/License-MIT-lightgrey)

---

## Overview

SemanticShield is an intelligent plagiarism detection platform that analyzes uploaded documents and identifies exact, near-duplicate, and semantically similar content.

The system combines Natural Language Processing (NLP), Machine Learning, and document analysis techniques to generate detailed plagiarism reports with sentence-level insights and section-wise analysis.

Unlike traditional keyword matching approaches, SemanticShield focuses on semantic similarity and contextual relationships between documents.

---

## Features

* PDF, DOCX, and TXT document upload
* Semantic plagiarism detection
* Sentence-level similarity analysis
* Reference corpus comparison
* Section-wise plagiarism breakdown
* Machine Learning-based scoring
* AI-generated content estimation
* Interactive dashboard
* Similarity visualization
* Real-time document processing
* REST API support

---

## Architecture

```text
User Upload
     │
     ▼
Document Extraction
(PDF / DOCX / TXT)
     │
     ▼
Text Preprocessing
     │
     ▼
Sentence Segmentation
     │
     ▼
Feature Extraction
     │
     ├── TF-IDF Features
     ├── Similarity Metrics
     ├── NLP Features
     │
     ▼
Machine Learning Model
(Random Forest)
     │
     ▼
Plagiarism Prediction
     │
     ▼
Report Generation
     │
     ▼
React Dashboard
```

---

## Tech Stack

### Backend

* FastAPI
* Uvicorn
* Scikit-Learn
* NumPy
* PDFPlumber
* Python-Docx

### Frontend

* React
* Vite
* Tailwind CSS

### Machine Learning

* Random Forest Classifier
* TF-IDF Feature Engineering
* Cosine Similarity
* NLP-based Similarity Features

---

## Project Structure

```text
SemanticShield/
│
├── backend/
│   ├── app/
│   │   ├── feature_extractor.py
│   │   └── __init__.py
│   │
│   ├── data/
│   ├── models/
│   │   ├── plagiarism_model.pkl
│   │   └── metrics.json
│   │
│   ├── reference_docs/
│   ├── main.py
│   ├── routes.py
│   ├── similarity.py
│   ├── utils.py
│   └── ml_engine.py
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── scripts/
│   ├── build_dataset.py
│   ├── train.py
│   └── evaluate.py
│
├── docs/
│   ├── architecture.md
│   └── model_report.md
│
├── .gitignore
└── README.md
```

---

## Machine Learning Pipeline

### Dataset Preparation

```bash
python scripts/build_dataset.py
```

### Model Training

```bash
python scripts/train.py
```

### Model Evaluation

```bash
python scripts/evaluate.py
```

### Saved Model

```text
backend/models/plagiarism_model.pkl
```

---

## Performance

Current evaluation results:

| Metric    | Score                     |
| --------- | ------------------------- |
| Accuracy  | 94%                       |
| Precision | Available in metrics.json |
| Recall    | Available in metrics.json |
| F1 Score  | Available in metrics.json |

Detailed evaluation reports can be found in:

```text
docs/model_report.md
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/Sarfarazsfz/SemanticShield.git
cd SemanticShield
```

### Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt
```

### Run Backend

```bash
python -m uvicorn main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

API Docs:

```text
http://127.0.0.1:8000/docs
```

---

### Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## API Endpoints

### Health Check

```http
GET /health
```

### Extract Text

```http
POST /extract-text
```

### Plagiarism Analysis

```http
POST /plagiarism-check
```

### Legacy Analysis

```http
POST /analyze
```

### Realtime Similarity

```http
POST /analyze-realtime
```

---

## Sample Workflow

1. Upload a PDF, DOCX, or TXT file.
2. Text is extracted automatically.
3. Document is split into sentences.
4. Features are generated.
5. Machine Learning model evaluates similarity.
6. Plagiarism score is calculated.
7. Detailed report is generated.
8. Results are visualized on the dashboard.

---

## Future Improvements

* Transformer-based embeddings
* SBERT integration
* Multi-language support
* Advanced semantic search
* Cloud deployment
* User authentication
* Batch document processing
* Research-paper citation analysis

---

## Author

**Md Sarfaraz Alam**

B.Tech Computer Science & Engineering

Machine Learning • NLP • Full Stack Development

GitHub:
https://github.com/Sarfarazsfz

---

## License

This project is intended for educational, research, and academic integrity purposes.
