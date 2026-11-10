import re
import logging
from typing import Dict, Any, Tuple, Optional
from sqlalchemy.orm import Session
from app.models import Reply, Prospect, SuppressionEntry
from app.llm.groq_client import groq_service
from app.config import settings
from app.services.audit import log_audit_event

logger = logging.getLogger(__name__)

# Broad keyword patterns for opt-out detection
OPT_OUT_PATTERNS = [
    r'\bstop\b',
    r'\bunsubscribe\b',
    r'\bremove\s+me\b',
    r'\btake\s+me\s+off\b',
    r'\bdo\s*not\s+contact\b',
    r'\bdon\'?t\s+contact\b',
    r'\bnot\s+interested\b',
    r'\bdelete\s+my\s+(?:data|information|email|contact|records?)\b',
    r'\bno\s+more\s+emails?\b',
    r'\bopt[\s-]out\b',
    r'\b(?:gdpr|dpdp|privacy)\s+(?:data\s+)?erasure\b',
    r'\bcease\s+(?:and\s+desist|all\s+contact|emails?|all\s+communications?|communications?)\b',
    r'\bstop\s+(?:contacting|all\s+contact|sending)\b',
    r'\blose\s+my\s+number\b',
    r'\bkindly\s+(?:remove|delete)\s+(?:me|my|our|this)\b',
    r'\bplease\s+(?:do\s+not|don\'?t)\s+email\s+(?:me|us)\s+again\b',
    r'\bnever\s+contact\s+(?:me|us)\s+again\b',
    r'\bdo\s+not\s+reach\s+out\b',
    r'\bspam\b'
]

INTERESTED_PATTERNS = [
    r'\binterested\b',
    r'\blet\'?s\s+(?:connect|chat|talk|discuss|schedule|speak)\b',
    r'\bhappy\s+to\s+chat\b',
    r'\bbook\s+(?:a\s+)?demo\b',
    r'\bsend\s+(?:a\s+)?calendar\s+invite\b',
    r'\bshare\s+(?:the\s+)?(?:product\s+)?deck\b',
    r'\bavailability\b',
    r'\bavailable\s+(?:tomorrow|next\s+week|monday|tuesday|wednesday|thursday|friday)\b',
    r'\bsounds\s+(?:good|promising|relevant|interesting)\b',
    r'\bwould\s+love\s+to\s+see\b'
]

WRONG_PERSON_PATTERNS = [
    r'\bwrong\s+(?:person|contact)\b',
    r'\bnot\s+the\s+right\s+person\b',
    r'\bnot\s+responsible\b',
    r'\bno\s+longer\s+with\b',
    r'\bno\s+longer\s+handling\b',
    r'\bleft\s+the\s+company\b',
    r'\breach\s+out\s+to\b',
    r'\bforward(?:ed|ing)?\s+to\b',
    r'\bmoved\s+to\s+(?:a\s+)?different\b',
    r'\bredirect\s+(?:your\s+inquiry|this)\b',
    r'\bcontact\s+(?:our|my)\s+(?:ciso|dpo|cto|legal|general\s+counsel|compliance)\b',
    r'\bspeak\s+with\s+(?:our|my)\b'
]

NOT_NOW_PATTERNS = [
    r'\bnot\s+now\b',
    r'\bbusy\s+this\s+quarter\b',
    r'\bcheck\s+back\s+(?:next\s+quarter|in\s+\d+\s+months?|later)\b',
    r'\brevisit\s+(?:in|next)\b',
    r'\bcurrently\s+evaluating\s+another\b',
    r'\bno\s+budget\s+at\s+this\s+moment\b'
]

def classify_reply_text(body: str) -> Tuple[str, float, str, str]:
    """
    Two-stage classifier:
    1. Fast deterministic keyword rules run FIRST (guarantees 100% catch rate on explicit opt-outs)
    2. Groq LLM classifier runs second for nuance, context, and edge cases
    """
    clean_body = body.strip().lower()

    # Stage 1: Keyword Rules
    # Check opt-out first (highest priority compliance rule)
    for pattern in OPT_OUT_PATTERNS:
        if re.search(pattern, clean_body, re.IGNORECASE):
            return "opt_out", 1.0, f"Matched statutory opt-out keyword pattern: '{pattern}'", "keyword_rule"

    for pattern in INTERESTED_PATTERNS:
        if re.search(pattern, clean_body, re.IGNORECASE):
            return "interested", 0.95, f"Matched positive intent pattern: '{pattern}'", "keyword_rule"

    for pattern in WRONG_PERSON_PATTERNS:
        if re.search(pattern, clean_body, re.IGNORECASE):
            return "wrong_person", 0.90, f"Matched referral / wrong person pattern: '{pattern}'", "keyword_rule"

    for pattern in NOT_NOW_PATTERNS:
        if re.search(pattern, clean_body, re.IGNORECASE):
            return "not_now", 0.85, f"Matched deferral / timing pattern: '{pattern}'", "keyword_rule"

    # Stage 2: Groq Classifier if available
    if groq_service.is_configured():
        try:
            prompt = (
                f"You are a sales and compliance email reply classifier for Indian B2B tech outreach.\n"
                f"Classify this incoming reply strictly into one of four labels:\n"
                f"1. 'opt_out': any request to stop, unsubscribe, remove contact, erasure, or cease contact.\n"
                f"2. 'interested': requests demo, meeting, pricing, product deck, or shows clear interest.\n"
                f"3. 'wrong_person': directs to another colleague, claims no longer responsible, or left role.\n"
                f"4. 'not_now': polite deferral, timing issue, check back later, no current budget.\n\n"
                f"Email Body:\n\"\"\"\n{body}\n\"\"\"\n\n"
                f"Respond with JSON: {{\"classification\": \"opt_out\"|\"interested\"|\"wrong_person\"|\"not_now\", \"confidence\": 0.0-1.0, \"reason\": \"...\"}}"
            )
            res = groq_service.chat_completion_json([
                {"role": "system", "content": "You are an accurate email reply intent classifier."},
                {"role": "user", "content": prompt}
            ])
            classification = res.get("classification", "not_now")
            confidence = float(res.get("confidence", 0.8))
            reason = res.get("reason", "Groq LLM intent classification")
            return classification, confidence, reason, "groq_llm"
        except Exception as e:
            logger.warning(f"Groq reply classifier failed ({e}); falling back to default heuristic.")

    # Default fallback
    return "not_now", 0.5, "Default fallback classification", "fallback_heuristic"

def record_incoming_reply(
    db: Session,
    from_email: str,
    body: str,
    subject: str = "Re: DPDP Act 2023 Readiness"
) -> Reply:
    """
    Processes incoming reply:
    1. Classifies reply text (keyword rule first, then Groq LLM)
    2. If opt_out: INSTANTLY adds email to suppression list (Section 8(7) right to erase)
    3. If interested: flags prospect and associates demo calendar link
    """
    clean_email = from_email.strip().lower()
    prospect = db.query(Prospect).filter(Prospect.work_email == clean_email).first()

    classification, confidence, reason, source = classify_reply_text(body)

    reply = Reply(
        prospect_id=prospect.id if prospect else None,
        from_email=clean_email,
        subject=subject,
        body=body,
        classification=classification,
        confidence=confidence,
        classification_reason=reason,
        classifier_source=source
    )
    db.add(reply)

    if prospect:
        prospect.last_engaged_at = reply.created_at
        if classification == "opt_out":
            prospect.status = "opted_out"
        elif classification == "interested":
            prospect.status = "replied"
        else:
            prospect.status = "replied"

    # Automated suppression on opt-out
    if classification == "opt_out":
        existing_supp = db.query(SuppressionEntry).filter(SuppressionEntry.email == clean_email).first()
        if not existing_supp:
            supp_entry = SuppressionEntry(
                email=clean_email,
                reason="reply_opt_out",
                source_note=f"Automatic opt-out via reply: {reason}"
            )
            db.add(supp_entry)
            log_audit_event(
                db,
                event_type="SUPPRESSION_ADDED_REPLY",
                actor="reply_tracker_agent",
                entity_id=clean_email,
                details={"reason": reason, "reply_snippet": body[:120]}
            )

    db.commit()
    db.refresh(reply)
    return reply
