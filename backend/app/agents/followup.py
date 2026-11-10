import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Prospect, Draft, OutboxMessage
from app.rag.fact_checker import verify_draft
from app.services.audit import log_audit_event

def queue_follow_up_drafts(db: Session, days_since_send: int = 5) -> Dict[str, Any]:
    """
    Identifies prospects sent an outreach email >= 5 days ago with no reply,
    and drafts a concise, respectful follow-up email queued strictly for human review.
    NEVER auto-sends.
    """
    cutoff_time = datetime.utcnow() - timedelta(days=days_since_send)
    
    # Prospects sent before cutoff without subsequent replies or opt outs
    candidates = db.query(Prospect).filter(
        Prospect.status == "sent",
        Prospect.last_engaged_at <= cutoff_time
    ).all()

    queued_drafts = []
    for p in candidates:
        # Check if follow-up draft already exists
        existing_fu = db.query(Draft).filter(
            Draft.prospect_id == p.id,
            Draft.subject.like("Following up: %")
        ).first()
        if existing_fu:
            continue

        subject = f"Following up: DPDP Act readiness - {p.company}"
        body = (
            f"Hi {p.name},\n\n"
            f"I wanted to briefly follow up on my earlier note regarding {p.company}'s preparation for DPDP Act 2023 compliance. "
            f"Under Section 8(5) and Section 8(6), proactive audit readiness and breach safeguards are critical ahead of full enforcement, where statutory penalties can reach up to ₹250 crore depending on the breach.\n\n"
            f"At RegulationFlow Technologies, DPDPFlow provides turnkey automation so your team stays ahead of the Board's guidelines. "
            f"Would 10 minutes next Tuesday work for a quick demonstration?\n\n"
            f"Best regards,\nAakash Verma, DPDPFlow\n\n"
            f"Unsubscribe: {{{{unsubscribe_link}}}}"
        )
        linkedin = f"Hi {p.name}, following up briefly on my earlier note regarding {p.company}'s DPDP Act Section 8 compliance readiness. Let me know if sharing our 5-minute technical brief would be helpful."

        passed, reasons, metrics = verify_draft(body, linkedin)

        draft = Draft(
            prospect_id=p.id,
            persona=p.role,
            subject=subject,
            email_body=body,
            linkedin_note=linkedin[:300],
            ab_variant="followup_standard",
            citations=json.dumps([{"title": "DPDP Act Section 8", "section": "Section 8"}]),
            fact_check_passed=passed,
            fact_check_reasons=json.dumps(reasons),
            word_count=metrics["word_count"],
            linkedin_char_count=metrics["linkedin_char_count"],
            status="drafted"
        )
        db.add(draft)
        queued_drafts.append(draft)

    db.commit()

    if queued_drafts:
        log_audit_event(
            db,
            event_type="FOLLOWUP_DRAFTED",
            actor="followup_agent",
            details={"queued_count": len(queued_drafts)}
        )

    return {
        "candidate_count": len(candidates),
        "queued_followup_count": len(queued_drafts)
    }
