from datetime import datetime, date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.config import settings
from app.models import Draft, Prospect, OutboxMessage, SuppressionEntry
from app.services.smtp import dispatch_email_message
from app.services.audit import log_audit_event

def get_today_sent_count(db: Session) -> int:
    today_start = datetime.combine(date.today(), datetime.min.time())
    return db.query(OutboxMessage).filter(
        OutboxMessage.sent_at >= today_start,
        OutboxMessage.status.in_(["sent_dry_run", "sent_live"])
    ).count()

def run_sender_agent(db: Session, draft_ids: Optional[List[int]] = None) -> Dict[str, Any]:
    """
    Sender Agent executing outbound dispatches:
    1. Human Review Gate: only drafts with status='approved' can be sent.
    2. Legal Sign-off Gate: live sending blocked if LEGAL_REVIEWED_TEMPLATES is false.
    3. Daily cap enforcement (default 30, max 50).
    4. Suppression list check (Hard stop).
    5. Dry-run safety outbox storage or live SMTP dispatch.
    """
    # Guard: Legal review gate for live sending
    if not settings.DRY_RUN and not settings.LEGAL_REVIEWED_TEMPLATES:
        return {
            "status": "blocked",
            "message": "Legal sign-off gate active: Settings toggle 'Legal reviewed message templates' must be enabled before live sending.",
            "dispatched_count": 0
        }

    current_sent_today = get_today_sent_count(db)
    remaining_cap = max(0, settings.DAILY_CAP - current_sent_today)
    if remaining_cap <= 0:
        return {
            "status": "cap_reached",
            "message": f"Daily send cap reached ({current_sent_today}/{settings.DAILY_CAP}). Pacing throttled.",
            "dispatched_count": 0,
            "cap_used": current_sent_today,
            "daily_cap": settings.DAILY_CAP
        }

    query = db.query(Draft).filter(Draft.status == "approved")
    if draft_ids:
        query = query.filter(Draft.id.in_(draft_ids))

    approved_drafts = query.limit(remaining_cap).all()
    dispatched = []
    blocked_suppressed = []

    for draft in approved_drafts:
        prospect = draft.prospect
        if not prospect:
            continue

        success, msg, outbox = dispatch_email_message(db, draft, prospect)
        if success:
            draft.status = "sent"
            dispatched.append({"draft_id": draft.id, "email": prospect.work_email, "status": outbox.status})
        else:
            if "suppression" in msg.lower():
                blocked_suppressed.append({"draft_id": draft.id, "email": prospect.work_email, "reason": msg})

    db.commit()

    return {
        "status": "success",
        "dispatched_count": len(dispatched),
        "blocked_suppressed_count": len(blocked_suppressed),
        "daily_cap_used": current_sent_today + len(dispatched),
        "daily_cap_limit": settings.DAILY_CAP,
        "is_dry_run": settings.DRY_RUN,
        "dispatched": dispatched,
        "blocked": blocked_suppressed
    }
