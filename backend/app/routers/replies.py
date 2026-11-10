from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db import get_db
from app.models import Reply
from app.schemas import ReplyCreate, ReplyResponse
from app.agents.reply_tracker import record_incoming_reply
from app.config import settings

router = APIRouter(prefix="/api/replies", tags=["Replies"])

@router.get("", response_model=List[ReplyResponse])
def get_replies(db: Session = Depends(get_db)):
    return db.query(Reply).order_by(Reply.id.desc()).all()

@router.post("", response_model=ReplyResponse)
def submit_reply(payload: ReplyCreate, db: Session = Depends(get_db)):
    reply = record_incoming_reply(
        db,
        from_email=payload.from_email,
        body=payload.body,
        subject=payload.subject or "Re: DPDP Act 2023 Readiness"
    )
    return reply

@router.get("/demo-link")
def get_demo_link():
    return {
        "calendar_url": settings.CALENDAR_URL,
        "product_url": "https://dpdpflow.com"
    }
