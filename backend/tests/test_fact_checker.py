import pytest
from app.rag.fact_checker import verify_draft
from app.llm.prompts import get_offline_fallback_draft

def test_clean_draft_passes_fact_checker():
    prospect = {
        "name": "Aarav Sharma",
        "role": "DPO",
        "company": "FinFlow",
        "source": "public leadership directory",
        "sector": "fintech",
        "recent_trigger": "audit preparation"
    }
    draft = get_offline_fallback_draft(prospect, "DPO", "A_A", [])
    passed, reasons, metrics = verify_draft(draft["email_body"], draft["linkedin_note"])
    assert passed is True
    assert len(reasons) == 0
    assert 90 <= metrics["word_count"] <= 120
    assert metrics["linkedin_char_count"] <= 300

def test_banned_penalty_phrase_is_blocked():
    email = (
        "Hi Aarav,\n\n"
        "I found your contact via public directory while researching compliance. "
        "Under Section 8 of the DPDP Act 2023, failure to implement safeguards carries statutory penalties of ₹250 crore per violation across all organizations. "
        "At RegulationFlow Technologies, DPDPFlow provides turnkey consent automation and incident response. "
        "Would you be open to a 10-minute briefing next week to benchmark your readiness before the statutory enforcement date in May 2027?\n\n"
        "Best regards,\nAakash Verma, DPDPFlow\n\n"
        "Unsubscribe: {{unsubscribe_link}}"
    )
    linkedin = "Hi Aarav, let's connect regarding DPDP Act Section 8 compliance for Indian tech companies."
    passed, reasons, metrics = verify_draft(email, linkedin)
    assert passed is False
    assert any("banned phrase" in r.lower() for r in reasons)

def test_hallucinated_section_is_blocked():
    email = (
        "Hi Aarav,\n\n"
        "I found your contact via public directory while researching compliance. "
        "Under Section 89 of the DPDP Act 2023, strict obligations apply to Indian firms. "
        "Statutory penalties can reach up to ₹250 crore depending on the breach. "
        "At RegulationFlow Technologies, DPDPFlow provides turnkey consent automation and incident response. "
        "Would you be open to a 10-minute briefing next week to benchmark your readiness before the statutory enforcement date in May 2027?\n\n"
        "Best regards,\nAakash Verma, DPDPFlow\n\n"
        "Unsubscribe: {{unsubscribe_link}}"
    )
    linkedin = "Hi Aarav, let's connect regarding DPDP Act Section 89 compliance."
    passed, reasons, metrics = verify_draft(email, linkedin)
    assert passed is False
    assert any("statutory hallucination" in r.lower() for r in reasons)

def test_missing_unsubscribe_link_is_blocked():
    email = (
        "Hi Aarav,\n\n"
        "I found your contact via public directory while researching compliance. "
        "Under Section 8 of the DPDP Act 2023, strict obligations apply to Indian firms. "
        "Statutory penalties can reach up to ₹250 crore depending on the breach. "
        "At RegulationFlow Technologies, DPDPFlow provides turnkey consent automation and incident response. "
        "Would you be open to a 10-minute briefing next week to benchmark your readiness before the statutory enforcement date in May 2027?\n\n"
        "Best regards,\nAakash Verma, DPDPFlow"
    )
    linkedin = "Hi Aarav, let's connect regarding DPDP Act Section 8 compliance."
    passed, reasons, metrics = verify_draft(email, linkedin)
    assert passed is False
    assert any("unsubscribe" in r.lower() for r in reasons)
