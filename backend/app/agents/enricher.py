from typing import List, Dict, Any
from sqlalchemy.orm import Session
from app.models import Prospect
from app.services.email_verify import verify_email_address
from app.services.audit import log_audit_event

def enrich_and_verify_prospects(db: Session, prospect_ids: List[int] = None) -> Dict[str, Any]:
    """
    Enriches and validates work email deliverability:
    1. Syntax verification
    2. Rejects personal consumer email domains (gmail, yahoo, etc.)
    3. Validates corporate MX records to maintain high deliverability and low bounce risk
    """
    query = db.query(Prospect)
    if prospect_ids:
        query = query.filter(Prospect.id.in_(prospect_ids))
    else:
        query = query.filter(Prospect.status == "imported")

    prospects = query.all()
    verified_count = 0
    rejected_count = 0
    results = []

    for p in prospects:
        valid, msg, details = verify_email_address(p.work_email, check_mx=True)
        if valid:
            p.email_verified = True
            p.email_verification_status = "valid"
            p.status = "verified"
            verified_count += 1
            results.append({"id": p.id, "email": p.work_email, "verified": True, "message": msg})
        else:
            p.email_verified = False
            p.email_verification_status = msg[:50]
            p.status = "rejected_enrichment"
            rejected_count += 1
            results.append({"id": p.id, "email": p.work_email, "verified": False, "message": msg})

    db.commit()

    if prospects:
        log_audit_event(
            db,
            event_type="ENRICHMENT_VERIFICATION",
            actor="enricher_agent",
            details={"verified": verified_count, "rejected": rejected_count}
        )

    return {
        "processed_count": len(prospects),
        "verified_count": verified_count,
        "rejected_count": rejected_count,
        "details": results
    }
