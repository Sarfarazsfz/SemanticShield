"""
SemanticShield — FastAPI Backend
Main application entry point.
Run: cd backend && python -m uvicorn main:app --reload
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import router
import logging

# ── Logging ────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s │ %(levelname)s │ %(name)s │ %(message)s",
)
logger = logging.getLogger("SemanticShield")

# ── App ────────────────────────────────────────────────────────────
app = FastAPI(
    title="SemanticShield API",
    description="AI-Powered Semantic Plagiarism Detection System",
    version="1.0.0",
)

# CORS — allow React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(router)


@app.get("/")
def root():
    return {"message": "SemanticShield API running"}


@app.on_event("startup")
def startup_event():
    logger.info("SemanticShield ready")
    logger.info("Application startup complete")
