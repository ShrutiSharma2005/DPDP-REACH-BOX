import json
import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Prospect, Draft
from app.rag.retriever import get_retriever
from app.rag.fact_checker import verify_draft
from app.llm.groq_client import groq_service
from app.llm.prompts import (
    SYSTEM_WRITER_PROMPT,
    PERSONA_THEMES,
    AB_VARIANTS,
    get_offline_fallback_draft
)
from app.services.audit import log_audit_event

logger = logging.getLogger(__name__)

def determine_persona(role: str) -> str:
    r = role.lower()
    if "ciso" in r or "security" in r or "infosec" in r:
        return "CISO"
    if "cto" in r or "tech" in r or "engineering" in r:
        return "CTO"
    if "legal" in r or "counsel" in r or "advocate" in r:
        return "Head of Legal"
    if "founder" in r or "ceo" in r or "co-founder" in r:
        return "Founder"
    return "DPO / Head of Compliance"

def get_few_shot_examples(db: Session, persona: str, limit: int = 2) -> List[Dict[str, str]]:
    """Fetches high-quality human-edited or approved drafts as few-shot in-context learning."""
    approved_drafts = db.query(Draft).filter(
        Draft.persona == persona,
        Draft.status.in_(["approved", "edited"]),
        Draft.fact_check_passed == True
    ).order_by(Draft.reviewed_at.desc().nullslast()).limit(limit).all()

    examples = []
    for d in approved_drafts:
        examples.append({
            "subject": d.subject,
            "email_body": d.email_body,
            "linkedin_note": d.linkedin_note
        })
    return examples

def generate_draft_for_prospect(
    db: Session,
    prospect: Prospect,
    ab_variant: str = "A_A"
) -> Draft:
    """
    RAG-grounded drafting pipeline:
    1. Persona classification
    2. BM25 retrieval over DPDP Act & DPDPFlow facts
    3. Groq LLM synthesis (with retry/backoff) or offline fallback
    4. Rigorous fact checking
    5. Draft persistence
    """
    persona = determine_persona(prospect.role)
    retriever = get_retriever()
    query = f"{persona} {prospect.sector} {prospect.recent_trigger or 'DPDP compliance'}"
    citations = retriever.retrieve(query, top_k=2)

    prospect_dict = {
        "name": prospect.name,
        "role": prospect.role,
        "company": prospect.company,
        "source": prospect.source,
        "sector": prospect.sector,
        "recent_trigger": prospect.recent_trigger or "compliance preparation"
    }

    draft_content = None

    if groq_service.is_configured():
        try:
            few_shots = get_few_shot_examples(db, persona)
            prompt_user = (
                f"Prospect Details:\n"
                f"Name: {prospect.name}\n"
                f"Role: {prospect.role}\n"
                f"Company: {prospect.company}\n"
                f"Sector: {prospect.sector}\n"
                f"Source: {prospect.source}\n"
                f"Recent Trigger: {prospect.recent_trigger or 'Upcoming DPDP Act enforcement'}\n"
                f"Persona Focus: {PERSONA_THEMES.get(persona, 'Readiness and Section 8 safeguards')}\n"
                f"A/B Variant Style: {AB_VARIANTS.get(ab_variant, {}).get('subject_prefix')}\n\n"
                f"Retrieved DPDP Act & Product Citations:\n"
                f"{json.dumps(citations, indent=2)}\n\n"
            )
            if few_shots:
                prompt_user += f"Reviewer-Approved Examples to match in tone and brevity:\n{json.dumps(few_shots, indent=2)}\n\n"

            messages = [
                {"role": "system", "content": SYSTEM_WRITER_PROMPT},
                {"role": "user", "content": prompt_user}
            ]
            draft_content = groq_service.chat_completion_json(messages)
        except Exception as e:
            logger.warning(f"Groq API call failed or timed out ({e}). Falling back to compliant offline template.")
            draft_content = get_offline_fallback_draft(prospect_dict, persona, ab_variant, citations)
    else:
        draft_content = get_offline_fallback_draft(prospect_dict, persona, ab_variant, citations)

    subject = draft_content.get("subject", f"DPDP Act readiness - {prospect.company}")
    email_body = draft_content.get("email_body", "")
    linkedin_note = draft_content.get("linkedin_note", "")

    # Execute Fact Checker
    passed, reasons, metrics = verify_draft(email_body, linkedin_note)

    draft = Draft(
        prospect_id=prospect.id,
        persona=persona,
        subject=subject,
        email_body=email_body,
        linkedin_note=linkedin_note,
        ab_variant=ab_variant,
        citations=json.dumps(citations),
        fact_check_passed=passed,
        fact_check_reasons=json.dumps(reasons),
        word_count=metrics["word_count"],
        linkedin_char_count=metrics["linkedin_char_count"],
        status="drafted"
    )
    db.add(draft)
    prospect.status = "drafted"
    db.commit()
    db.refresh(draft)

    return draft

def run_writer_agent(db: Session, prospect_ids: List[int] = None) -> Dict[str, Any]:
    query = db.query(Prospect)
    if prospect_ids:
        query = query.filter(Prospect.id.in_(prospect_ids))
    else:
        query = query.filter(Prospect.status == "cleared")

    prospects = query.all()
    created_drafts: List[Draft] = []
    ab_keys = ["A_A", "A_B", "B_A", "B_B"]

    for idx, p in enumerate(prospects):
        # Evenly distribute A/B variants across prospects
        variant = ab_keys[idx % len(ab_keys)]
        draft = generate_draft_for_prospect(db, p, ab_variant=variant)
        created_drafts.append(draft)

    if created_drafts:
        log_audit_event(
            db,
            event_type="DRAFT_GENERATION",
            actor="writer_agent",
            details={"drafts_generated": len(created_drafts)}
        )

    return {
        "processed_count": len(prospects),
        "drafts_generated": len(created_drafts),
        "fact_check_passed_count": sum(1 for d in created_drafts if d.fact_check_passed),
        "fact_check_failed_count": sum(1 for d in created_drafts if not d.fact_check_passed)
    }
