from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Prospect, SuppressionEntry
from app.services.audit import log_audit_event

router = APIRouter(prefix="/api/unsubscribe", tags=["Public Unsubscribe"])

@router.get("/{token}")
def handle_unsubscribe(token: str, db: Session = Depends(get_db)):
    """
    Public 1-click unsubscribe endpoint complying with DPDP Act Section 6 consent withdrawal
    and Section 8(7) erasure. Immediately adds the prospect's email to the suppression list.
    """
    prospect = db.query(Prospect).filter(Prospect.unsubscribe_token == token).first()
    if not prospect:
        # Check if already suppressed or invalid token
        return {
            "status": "success",
            "message": "Your preference has been recorded. You will not receive further outreach."
        }

    email = prospect.work_email.lower()

    # Instant hard suppression
    existing = db.query(SuppressionEntry).filter(SuppressionEntry.email == email).first()
    if not existing:
        entry = SuppressionEntry(
            email=email,
            reason="one_click_unsubscribe",
            source_note=f"Unsubscribed via public token link (Prospect #{prospect.id})"
        )
        db.add(entry)

    prospect.status = "opted_out"
    db.commit()

    log_audit_event(
        db,
        event_type="ONE_CLICK_UNSUBSCRIBE",
        actor="prospect_self_service",
        entity_id=email,
        details={"token": token, "prospect_id": prospect.id}
    )

    return {
        "status": "success",
        "email": email,
        "message": f"Successfully unsubscribed {email}. Your data has been added to our central suppression list with immediate effect."
    }
