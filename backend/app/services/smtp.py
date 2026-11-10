import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Tuple, Optional
from sqlalchemy.orm import Session
from app.config import settings
from app.models import OutboxMessage, Prospect, Draft, SuppressionEntry
from app.services.audit import log_audit_event

def build_unsubscribe_url(token: str) -> str:
    return f"{settings.PUBLIC_BASE_URL}/api/unsubscribe/{token}"

def dispatch_email_message(
    db: Session,
    draft: Draft,
    prospect: Prospect
) -> Tuple[bool, str, Optional[OutboxMessage]]:
    """
    Dispatches an email message adhering to:
    1. Pre-send suppression check (Hard stop, no override)
    2. Dynamic replacement of {{unsubscribe_link}}
    3. Dry-run safety gate: writes to local outbox when DRY_RUN=true
    4. Optional real SMTP transmission when DRY_RUN=false
    """
    # 1. Hard suppression check
    suppressed = db.query(SuppressionEntry).filter(SuppressionEntry.email == prospect.work_email).first()
    if suppressed:
        outbox = OutboxMessage(
            draft_id=draft.id,
            prospect_id=prospect.id,
            recipient_email=prospect.work_email,
            subject=draft.subject,
            email_body=draft.email_body,
            status="blocked_suppressed",
            error_message=f"Recipient is suppressed: {suppressed.reason}",
            is_dry_run=settings.DRY_RUN
        )
        db.add(outbox)
        db.commit()
        return False, f"Send blocked: {prospect.work_email} is on the suppression list.", outbox

    # 2. Render unsubscribe link
    unsub_url = build_unsubscribe_url(prospect.unsubscribe_token)
    rendered_body = draft.email_body.replace("{{unsubscribe_link}}", unsub_url)
    if unsub_url not in rendered_body:
        rendered_body += f"\n\nUnsubscribe: {unsub_url}"

    # 3. Create Outbox entry
    outbox = OutboxMessage(
        draft_id=draft.id,
        prospect_id=prospect.id,
        recipient_email=prospect.work_email,
        subject=draft.subject,
        email_body=rendered_body,
        is_dry_run=settings.DRY_RUN,
        scheduled_for=datetime.utcnow()
    )
    db.add(outbox)
    db.commit()
    db.refresh(outbox)

    # 4. Dispatch branch
    if settings.DRY_RUN:
        outbox.status = "sent_dry_run"
        outbox.sent_at = datetime.utcnow()
        prospect.status = "sent"
        prospect.last_engaged_at = datetime.utcnow()
        db.commit()

        log_audit_event(
            db,
            event_type="SEND_DISPATCH_DRY_RUN",
            actor="sender_agent",
            entity_id=str(outbox.id),
            details={"recipient": prospect.work_email, "mode": "DRY_RUN", "subject": draft.subject}
        )
        return True, "Email recorded to local outbox (DRY RUN mode).", outbox

    # Live SMTP branch
    if not settings.SMTP_HOST or not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        outbox.status = "failed"
        outbox.error_message = "SMTP credentials missing in .env while DRY_RUN=false."
        db.commit()
        return False, "Cannot send live email: SMTP configuration missing.", outbox

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = draft.subject
        msg["From"] = f"{settings.SENDER_NAME} <{settings.SENDER_EMAIL}>"
        msg["To"] = prospect.work_email
        msg["List-Unsubscribe"] = f"<{unsub_url}>"

        part = MIMEText(rendered_body, "plain", "utf-8")
        msg.attach(part)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
            if settings.SMTP_USE_TLS:
                server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SENDER_EMAIL, [prospect.work_email], msg.as_string())

        outbox.status = "sent_live"
        outbox.sent_at = datetime.utcnow()
        prospect.status = "sent"
        prospect.last_engaged_at = datetime.utcnow()
        db.commit()

        log_audit_event(
            db,
            event_type="SEND_DISPATCH_LIVE",
            actor="sender_agent",
            entity_id=str(outbox.id),
            details={"recipient": prospect.work_email, "mode": "LIVE_SMTP"}
        )
        return True, "Live email dispatched successfully via SMTP.", outbox

    except Exception as e:
        outbox.status = "failed"
        outbox.error_message = str(e)
        db.commit()
        return False, f"SMTP send failed: {str(e)}", outbox
