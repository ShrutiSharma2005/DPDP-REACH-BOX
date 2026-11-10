import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import get_db
from app.models import Draft, Prospect
from app.schemas import DraftResponse
from app.agents.writer import run_writer_agent

router = APIRouter(prefix="/api/drafts", tags=["Drafts"])

def format_draft(d: Draft) -> dict:
    try:
        citations = json.loads(d.citations) if d.citations else []
    except Exception:
        citations = []
    try:
        reasons = json.loads(d.fact_check_reasons) if d.fact_check_reasons else []
    except Exception:
        reasons = []

    return {
        "id": d.id,
        "prospect_id": d.prospect_id,
        "persona": d.persona,
        "subject": d.subject,
        "email_body": d.email_body,
        "linkedin_note": d.linkedin_note,
        "ab_variant": d.ab_variant,
        "citations": citations,
        "fact_check_passed": d.fact_check_passed,
        "fact_check_reasons": reasons,
        "word_count": d.word_count,
        "linkedin_char_count": d.linkedin_char_count,
        "status": d.status,
        "reviewer_notes": d.reviewer_notes,
        "created_at": d.created_at,
        "reviewed_at": d.reviewed_at,
        "prospect": d.prospect
    }

@router.get("", response_model=List[DraftResponse])
def get_drafts(
    status: Optional[str] = Query(None),
    persona: Optional[str] = Query(None),
    fact_check_passed: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Draft).join(Prospect)
    if status:
        query = query.filter(Draft.status == status)
    if persona:
        query = query.filter(Draft.persona == persona)
    if fact_check_passed is not None:
        query = query.filter(Draft.fact_check_passed == fact_check_passed)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Draft.subject.ilike(s)) |
            (Prospect.name.ilike(s)) |
            (Prospect.company.ilike(s))
        )
    drafts = query.order_by(Draft.id.desc()).all()
    return [format_draft(d) for d in drafts]

@router.post("/generate")
def generate_drafts(
    prospect_ids: Optional[List[int]] = None,
    db: Session = Depends(get_db)
):
    result = run_writer_agent(db, prospect_ids)
    return result

@router.get("/{draft_id}", response_model=DraftResponse)
def get_draft(draft_id: int, db: Session = Depends(get_db)):
    d = db.query(Draft).filter(Draft.id == draft_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Draft not found")
    return format_draft(d)
