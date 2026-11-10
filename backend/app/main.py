import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.db import engine, Base
from app.routers import (
    prospects, drafts, review, send,
    replies, metrics, settings as settings_router,
    unsubscribe, ab
)

# Create database tables if they do not exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="DPDPFlow Outreach Agent API",
    description="Compliant B2B engagement agent for Indian DPDP Act 2023 readiness",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(prospects.router)
app.include_router(drafts.router)
app.include_router(review.router)
app.include_router(send.router)
app.include_router(replies.router)
app.include_router(metrics.router)
app.include_router(ab.router)
app.include_router(settings_router.router)
app.include_router(unsubscribe.router)

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "app": "DPDPFlow Outreach Agent",
        "dry_run": settings.DRY_RUN,
        "legal_reviewed": settings.LEGAL_REVIEWED_TEMPLATES,
        "groq_configured": bool(settings.GROQ_API_KEY)
    }

@app.get("/")
def root():
    return {
        "message": "DPDPFlow Outreach Agent API is active.",
        "docs_url": "/docs",
        "dry_run": settings.DRY_RUN
    }
