import csv
import io
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import get_db
from app.config import settings
from app.models import SuppressionEntry, AuditLog
from app.schemas import (
    SettingsResponse, SettingsUpdateRequest,
    SuppressionCreate, SuppressionResponse, AuditLogResponse
)
from app.agents.retention import run_retention_cleanup
from app.services.audit import log_audit_event

router = APIRouter(prefix="/api/settings", tags=["Settings & Compliance Control"])

@router.get("", response_model=SettingsResponse)
def get_settings():
    return {
        "GROQ_API_KEY_CONFIGURED": bool(settings.GROQ_API_KEY),
        "GROQ_MODEL": settings.GROQ_MODEL,
        "GROQ_FALLBACK_MODEL": settings.GROQ_FALLBACK_MODEL,
        "DRY_RUN": settings.DRY_RUN,
        "LEGAL_REVIEWED_TEMPLATES": settings.LEGAL_REVIEWED_TEMPLATES,
        "DAILY_CAP": settings.DAILY_CAP,
        "SEND_SPACING_SECONDS": settings.SEND_SPACING_SECONDS,
        "WARMUP_TIER": settings.WARMUP_TIER,
        "SENDER_NAME": settings.SENDER_NAME,
        "SENDER_COMPANY": settings.SENDER_COMPANY,
        "SENDER_ROLE": settings.SENDER_ROLE,
        "SENDER_EMAIL": settings.SENDER_EMAIL,
        "SENDER_ADDRESS": settings.SENDER_ADDRESS,
        "SENDING_DOMAIN": settings.SENDING_DOMAIN,
        "CALENDAR_URL": settings.CALENDAR_URL,
        "RETENTION_DAYS": settings.RETENTION_DAYS,
        "PUBLIC_BASE_URL": settings.PUBLIC_BASE_URL
    }

@router.post("", response_model=SettingsResponse)
def update_settings(payload: SettingsUpdateRequest, db: Session = Depends(get_db)):
    # Legal Sign-Off Gate Check
    if payload.DRY_RUN is False:
        # Check if legal review is active either in payload or in current settings
        legal_reviewed = payload.LEGAL_REVIEWED_TEMPLATES if payload.LEGAL_REVIEWED_TEMPLATES is not None else settings.LEGAL_REVIEWED_TEMPLATES
        if not legal_reviewed:
            raise HTTPException(
                status_code=400,
                detail="Legal sign-off gate: You cannot disable DRY_RUN until 'Legal reviewed message templates' is turned ON."
            )

    if payload.GROQ_API_KEY is not None:
        settings.GROQ_API_KEY = payload.GROQ_API_KEY.strip()
        from app.llm.groq_client import groq_service
        groq_service.api_key = settings.GROQ_API_KEY
        if groq_service.api_key:
            from groq import Groq
            groq_service.client = Groq(api_key=groq_service.api_key)

    if payload.GROQ_MODEL is not None:
        settings.GROQ_MODEL = payload.GROQ_MODEL
    if payload.GROQ_FALLBACK_MODEL is not None:
        settings.GROQ_FALLBACK_MODEL = payload.GROQ_FALLBACK_MODEL
    if payload.LEGAL_REVIEWED_TEMPLATES is not None:
        settings.LEGAL_REVIEWED_TEMPLATES = payload.LEGAL_REVIEWED_TEMPLATES
    if payload.DRY_RUN is not None:
        settings.DRY_RUN = payload.DRY_RUN
    if payload.DAILY_CAP is not None:
        settings.DAILY_CAP = min(50, max(1, payload.DAILY_CAP))
    if payload.SEND_SPACING_SECONDS is not None:
        settings.SEND_SPACING_SECONDS = max(5, payload.SEND_SPACING_SECONDS)
    if payload.SENDER_NAME is not None:
        settings.SENDER_NAME = payload.SENDER_NAME
    if payload.SENDER_COMPANY is not None:
        settings.SENDER_COMPANY = payload.SENDER_COMPANY
    if payload.SENDER_ROLE is not None:
        settings.SENDER_ROLE = payload.SENDER_ROLE
    if payload.SENDER_EMAIL is not None:
        settings.SENDER_EMAIL = payload.SENDER_EMAIL
    if payload.SENDER_ADDRESS is not None:
        settings.SENDER_ADDRESS = payload.SENDER_ADDRESS
    if payload.SENDING_DOMAIN is not None:
        settings.SENDING_DOMAIN = payload.SENDING_DOMAIN
    if payload.CALENDAR_URL is not None:
        settings.CALENDAR_URL = payload.CALENDAR_URL
    if payload.RETENTION_DAYS is not None:
        settings.RETENTION_DAYS = payload.RETENTION_DAYS

    log_audit_event(
        db,
        event_type="SETTINGS_UPDATED",
        actor="user_admin",
        details={"dry_run": settings.DRY_RUN, "legal_reviewed": settings.LEGAL_REVIEWED_TEMPLATES}
    )

    return get_settings()

@router.post("/seed-demo")
def trigger_seed_demo():
    import sys
    import os
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    if root_dir not in sys.path:
        sys.path.insert(0, root_dir)
    from scripts.seed_demo import seed_demo_data
    seed_demo_data()
    return {"status": "success", "message": "Demo data successfully seeded."}

@router.post("/retention-cleanup")
def trigger_retention_cleanup(db: Session = Depends(get_db)):
    return run_retention_cleanup(db, settings.RETENTION_DAYS)

# Suppression List Endpoints
@router.get("/suppression", response_model=List[SuppressionResponse])
def get_suppression_list(db: Session = Depends(get_db)):
    return db.query(SuppressionEntry).order_by(SuppressionEntry.suppressed_at.desc()).all()

@router.post("/suppression", response_model=SuppressionResponse)
def add_suppression_entry(payload: SuppressionCreate, db: Session = Depends(get_db)):
    clean_email = payload.email.strip().lower()
    existing = db.query(SuppressionEntry).filter(SuppressionEntry.email == clean_email).first()
    if existing:
        return existing
    
    entry = SuppressionEntry(
        email=clean_email,
        reason=payload.reason or "manual_admin",
        source_note=payload.source_note or "Manual admin addition"
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    log_audit_event(
        db,
        event_type="SUPPRESSION_ADDED_MANUAL",
        actor="admin",
        entity_id=clean_email
    )
    return entry

@router.get("/suppression/export-csv")
def export_suppression_csv(db: Session = Depends(get_db)):
    entries = db.query(SuppressionEntry).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["email", "reason", "source_note", "suppressed_at"])
    for e in entries:
        writer.writerow([e.email, e.reason, e.source_note, e.suppressed_at.isoformat()])
    
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=suppression_list.csv"}
    )

# Audit Log Endpoints
@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit).all()

@router.get("/audit-logs/export-csv")
def export_audit_logs_csv(db: Session = Depends(get_db)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "timestamp", "event_type", "actor", "entity_id", "details"])
    for l in logs:
        writer.writerow([l.id, l.timestamp.isoformat(), l.event_type, l.actor, l.entity_id or "", l.details or ""])

    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=dpdp_audit_trail.csv"}
    )
