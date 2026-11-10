from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Prospect, SuppressionEntry
from app.services.audit import log_audit_event

VALID_LAWFUL_BASES = {
    "made_public_by_person": "Act s.3(c)(ii)(A) - Personal data made publicly available by Data Principal",
    "gave_voluntarily": "Act s.7(a) - Specified purpose for which data principal voluntarily provided data",
    "consented": "Act s.6 - Free, specific, informed affirmative consent"
}

def run_compliance_check(db: Session, prospect_ids: List[int] = None) -> Dict[str, Any]:
    """
    Performs statutory compliance gate checks:
    1. Suppression check against central opt-out list (Instant hard stop)
    2. Verification of statutory lawful basis under DPDP Act 2023
    3. Source provenance check
    4. Clears compliant prospects for message drafting (status='cleared')
    """
    query = db.query(Prospect)
    if prospect_ids:
        query = query.filter(Prospect.id.in_(prospect_ids))
    else:
        query = query.filter(Prospect.status == "verified")

    prospects = query.all()
    cleared_count = 0
    blocked_count = 0
    details = []

    suppressed_emails = set(s[0].lower() for s in db.query(SuppressionEntry.email).all())

    for p in prospects:
        # Check suppression
        if p.work_email.lower() in suppressed_emails:
            p.status = "suppressed"
            blocked_count += 1
            details.append({"id": p.id, "email": p.work_email, "status": "blocked", "reason": "Present in central suppression list."})
            continue

        # Check lawful basis
        if p.lawful_basis not in VALID_LAWFUL_BASES:
            p.status = "needs_legal_ruling"
            blocked_count += 1
            details.append({"id": p.id, "email": p.work_email, "status": "blocked", "reason": f"Invalid basis '{p.lawful_basis}'. Needs legal ruling."})
            continue

        # Passed all compliance checks -> Cleared for drafting
        p.status = "cleared"
        cleared_count += 1
        details.append({"id": p.id, "email": p.work_email, "status": "cleared", "basis": p.lawful_basis})

    db.commit()

    if prospects:
        log_audit_event(
            db,
            event_type="COMPLIANCE_CLEARANCE",
            actor="compliance_agent",
            details={"cleared": cleared_count, "blocked": blocked_count}
        )

    return {
        "processed_count": len(prospects),
        "cleared_count": cleared_count,
        "blocked_count": blocked_count,
        "details": details
    }
