from datetime import datetime, timedelta
from typing import Dict, Any
from sqlalchemy.orm import Session
from app.models import Prospect
from app.config import settings
from app.services.audit import log_audit_event

def run_retention_cleanup(db: Session, retention_days: int = None) -> Dict[str, Any]:
    """
    Implements statutory data minimisation under Section 8(7) of the DPDP Act 2023:
    Deletes prospect records that have had no engagement (no positive replies, no open threads)
    after the specified retention period (default 90 days).
    """
    days = retention_days if retention_days is not None else settings.RETENTION_DAYS
    cutoff_date = datetime.utcnow() - timedelta(days=days)

    # Find unengaged prospects older than retention limit
    expired_prospects = db.query(Prospect).filter(
        Prospect.created_at <= cutoff_date,
        Prospect.status.in_(["imported", "verified", "cleared", "drafted", "rejected_enrichment", "needs_legal_ruling"])
    ).all()

    purged_records = []
    for p in expired_prospects:
        purged_records.append({
            "id": p.id,
            "email": p.work_email,
            "source": p.source,
            "created_at": p.created_at.isoformat()
        })
        db.delete(p)

    db.commit()

    if purged_records:
        log_audit_event(
            db,
            event_type="RETENTION_PURGE",
            actor="retention_agent",
            details={
                "retention_days": days,
                "purged_count": len(purged_records),
                "records_sample": purged_records[:10]
            }
        )

    return {
        "status": "success",
        "retention_days": days,
        "purged_count": len(purged_records),
        "purged_records": purged_records
    }
