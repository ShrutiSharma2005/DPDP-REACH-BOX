from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import get_db
from app.models import OutboxMessage, Draft
from app.schemas import OutboxResponse
from app.agents.sender import run_sender_agent, get_today_sent_count
from app.config import settings

router = APIRouter(prefix="/api/send", tags=["Send Queue & Outbox"])

@router.post("/dispatch")
def dispatch_sends(
    draft_ids: Optional[List[int]] = None,
    db: Session = Depends(get_db)
):
    result = run_sender_agent(db, draft_ids)
    return result

@router.get("/queue")
def get_queue_status(db: Session = Depends(get_db)):
    sent_today = get_today_sent_count(db)
    approved_queued = db.query(Draft).filter(Draft.status == "approved").count()

    return {
        "daily_cap": settings.DAILY_CAP,
        "daily_cap_used": sent_today,
        "daily_cap_remaining": max(0, settings.DAILY_CAP - sent_today),
        "approved_queue_count": approved_queued,
        "send_spacing_seconds": settings.SEND_SPACING_SECONDS,
        "warmup_tier": settings.WARMUP_TIER,
        "is_dry_run": settings.DRY_RUN,
        "legal_reviewed": settings.LEGAL_REVIEWED_TEMPLATES,
        "sending_domain": settings.SENDING_DOMAIN
    }

@router.get("/outbox", response_model=List[OutboxResponse])
def get_outbox_messages(
    status: Optional[str] = Query(None),
    limit: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(OutboxMessage)
    if status:
        query = query.filter(OutboxMessage.status == status)
    return query.order_by(OutboxMessage.id.desc()).limit(limit).all()
