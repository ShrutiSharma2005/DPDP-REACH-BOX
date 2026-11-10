import json
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import AuditLog

def log_audit_event(
    db: Session,
    event_type: str,
    actor: str = "system",
    entity_id: str = None,
    details: dict = None
) -> AuditLog:
    """
    Creates an immutable audit log entry for compliance tracing under DPDP Act requirements.
    """
    details_str = json.dumps(details) if isinstance(details, dict) else str(details or "")
    log_entry = AuditLog(
        timestamp=datetime.utcnow(),
        event_type=event_type,
        actor=actor,
        entity_id=str(entity_id) if entity_id else None,
        details=details_str
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry
