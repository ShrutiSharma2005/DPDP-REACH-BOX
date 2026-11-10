from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any
from app.db import get_db
from app.models import Draft, Prospect
from app.schemas import DraftUpdateRequest, BulkApproveRequest
from app.rag.fact_checker import verify_draft
from app.services.audit import log_audit_event
from app.routers.drafts import format_draft

router = APIRouter(prefix="/api/review", tags=["Review"])

@router.post("/{draft_id}")
def review_draft(
    draft_id: int,
    payload: DraftUpdateRequest,
    db: Session = Depends(get_db)
):
    draft = db.query(Draft).filter(Draft.id == draft_id).first()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")

    # If email or linkedin is being edited, re-run fact checker
    is_edited = False
    if payload.email_body is not None and payload.email_body != draft.email_body:
        if not draft.original_email_body:
            draft.original_email_body = draft.email_body # store original for few-shot learning
        draft.email_body = payload.email_body
        is_edited = True

    if payload.linkedin_note is not None and payload.linkedin_note != draft.linkedin_note:
        draft.linkedin_note = payload.linkedin_note
        is_edited = True

    if payload.subject is not None:
        draft.subject = payload.subject

    if is_edited:
        passed, reasons, metrics = verify_draft(draft.email_body, draft.linkedin_note)
        draft.fact_check_passed = passed
        import json
        draft.fact_check_reasons = json.dumps(reasons)
        draft.word_count = metrics["word_count"]
        draft.linkedin_char_count = metrics["linkedin_char_count"]

    # Target status
    target_status = payload.status or ("edited" if is_edited else draft.status)
    
    # FACT CHECKER GATE: A draft failing any check CANNOT be approved!
    if target_status == "approved" and not draft.fact_check_passed:
        raise HTTPException(
            status_code=400,
            detail=f"Compliance gate failure: Draft cannot be approved because fact checks failed: {draft.fact_check_reasons}"
        )

    draft.status = target_status
    if payload.reviewer_notes:
        draft.reviewer_notes = payload.reviewer_notes
    draft.reviewed_at = datetime.utcnow()

    # Update prospect status
    if draft.prospect:
        if target_status == "approved":
            draft.prospect.status = "approved"
        elif target_status == "rejected":
            draft.prospect.status = "rejected_review"

    db.commit()

    log_audit_event(
        db,
        event_type="HUMAN_REVIEW_ACTION",
        actor="human_reviewer",
        entity_id=str(draft.id),
        details={"status": target_status, "is_edited": is_edited}
    )

    return {"status": "success", "draft": format_draft(draft)}

@router.post("/bulk-approve")
def bulk_approve(
    payload: BulkApproveRequest,
    db: Session = Depends(get_db)
):
    drafts = db.query(Draft).filter(Draft.id.in_(payload.draft_ids)).all()
    approved = []
    blocked = []

    for d in drafts:
        if not d.fact_check_passed:
            blocked.append({"id": d.id, "reason": "Failed fact-checker compliance constraints"})
            continue
        d.status = "approved"
        d.reviewed_at = datetime.utcnow()
        if d.prospect:
            d.prospect.status = "approved"
        approved.append(d.id)

    db.commit()

    log_audit_event(
        db,
        event_type="HUMAN_BULK_APPROVE",
        actor="human_reviewer",
        details={"approved_count": len(approved), "blocked_count": len(blocked)}
    )

    return {
        "approved_count": len(approved),
        "blocked_count": len(blocked),
        "approved_ids": approved,
        "blocked_details": blocked
    }

@router.get("/approval-rate")
def get_approval_rate(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Calculates approval rate per template / persona."""
    personas = ["DPO / Head of Compliance", "CISO / CTO", "CISO", "CTO", "Founder", "Head of Legal"]
    stats = {}
    for p in personas:
        total = db.query(Draft).filter(Draft.persona == p).count()
        approved = db.query(Draft).filter(Draft.persona == p, Draft.status.in_(["approved", "sent"])).count()
        unedited = db.query(Draft).filter(Draft.persona == p, Draft.status.in_(["approved", "sent"]), Draft.original_email_body.is_(None)).count()
        rate = round((approved / total) * 100, 1) if total > 0 else 0.0
        unedited_rate = round((unedited / approved) * 100, 1) if approved > 0 else 0.0
        stats[p] = {
            "total_drafts": total,
            "approved": approved,
            "approval_rate_pct": rate,
            "unedited_approvals_pct": unedited_rate
        }
    return stats
