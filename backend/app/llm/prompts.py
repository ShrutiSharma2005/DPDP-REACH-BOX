import re
from typing import Dict, Any, List

SYSTEM_WRITER_PROMPT = """You are a senior DPDP Act 2023 compliance communication specialist at RegulationFlow Technologies.
You draft concise, respectful, professional B2B outreach for Indian corporate leaders regarding DPDPFlow (dpdpflow.com).

CRITICAL COMPLIANCE AND EDITORIAL RULES:
1. WORD COUNT: The email body MUST be strictly between 90 and 120 words. Count your words carefully.
2. LINKEDIN NOTE: The LinkedIn connection note MUST be 300 characters or fewer.
3. FACTUAL INTEGRITY:
   - Cite ONLY actual sections of the DPDP Act 2023 (Sections 1 through 44). E.g. Section 5 (Notice), Section 8(5) (Security Safeguards), Section 8(6) (Breach Reporting), Section 8(7) (Retention/Erasure), Section 10 (SDF/DPO), Section 16 (Cross-border).
   - NEVER hallucinate nonexistent sections.
4. BANNED PHRASES:
   - NEVER write "₹250 crore per violation".
   - You MUST formulate penalties as: "penalties can reach up to ₹250 crore depending on the breach".
   - NEVER invent a "legitimate interest for B2B cold outreach" basis.
5. MANDATORY NOTICE DISCLOSURES:
   - State clearly who we are (Aakash Verma at DPDPFlow / RegulationFlow Technologies).
   - State clearly where we obtained their contact details (the prospect's specific source).
   - State the legitimate purpose of writing.
   - Always conclude with the unsubscribe placeholder tag: {{unsubscribe_link}}.

OUTPUT FORMAT:
Return valid JSON with keys:
{
  "subject": "...",
  "email_body": "...",
  "linkedin_note": "...",
  "cited_sections": ["Section 8", ...]
}
"""

PERSONA_THEMES = {
    "DPO": "Focus on regulatory readiness gaps, Section 8(7) automated data retention/erasure, and tamper-evident audit trails before May 2027.",
    "Head of Compliance": "Focus on statutory audit trails, Section 10 Significant Data Fiduciary obligations, and Board reporting.",
    "CISO": "Focus on Section 8(5) reasonable technical safeguards and the mandatory 72-hour breach reporting requirement to DPBI under Section 8(6).",
    "CTO": "Focus on engineering overhead, Section 8 security posture automation, database retention jobs, and avoiding in-house privacy tech stack building.",
    "Founder": "Focus on fast, affordable full-lifecycle DPDP compliance without hiring an expensive privacy consulting team, scaling safely.",
    "Head of Legal": "Focus on Section 5 multilingual consent notices, Section 11 Data Principal rights workflows, and Section 16 cross-border transfer controls."
}

AB_VARIANTS = {
    "A_A": {
        "subject_style": "Direct statutory inquiry",
        "subject_prefix": "DPDP Act readiness before May 2027",
        "opener_style": "Role and context hook"
    },
    "A_B": {
        "subject_style": "Direct statutory inquiry",
        "subject_prefix": "DPDP Act readiness before May 2027",
        "opener_style": "Trigger event / sector challenge hook"
    },
    "B_A": {
        "subject_style": "Section 8 compliance benchmark",
        "subject_prefix": "Section 8 safeguards audit benchmark",
        "opener_style": "Role and context hook"
    },
    "B_B": {
        "subject_style": "Section 8 compliance benchmark",
        "subject_prefix": "Section 8 safeguards audit benchmark",
        "opener_style": "Trigger event / sector challenge hook"
    }
}

def get_offline_fallback_draft(
    prospect: Dict[str, Any],
    persona_type: str,
    ab_variant: str,
    citations: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Generates a deterministic, compliant draft (90-120 words email, <=300 char LinkedIn note)
    guaranteeing that offline demos, test runs, and users without an immediate Groq key work flawlessly.
    """
    name = prospect.get("name", "there")
    role = prospect.get("role", "Leader")
    company = prospect.get("company", "your team")
    source = prospect.get("source", "public leadership directory")
    trigger = prospect.get("recent_trigger", "upcoming compliance milestones")

    variant = AB_VARIANTS.get(ab_variant, AB_VARIANTS["A_A"])
    subject = f"{variant['subject_prefix']} - {company}"

    if "CISO" in persona_type or "CTO" in persona_type:
        body = (
            f"Hi {name},\n\n"
            f"I noted your role leading security and engineering at {company} via {source}. "
            f"Under Section 8(5) and Section 8(6) of the DPDP Act 2023, Indian enterprises must implement verified technical safeguards against breaches and report incidents within strict regulatory timelines. "
            f"As your organization plans around {trigger}, statutory penalties can reach up to ₹250 crore depending on the breach.\n\n"
            f"At RegulationFlow Technologies, our platform DPDPFlow automates continuous Section 8 audit telemetry and incident reporting workflows. "
            f"Would you be open to a brief 10-minute technical review next week to explore our architecture?\n\n"
            f"Best regards,\nAakash Verma, DPDPFlow\n\n"
            f"Unsubscribe: {{{{unsubscribe_link}}}}"
        )
        linkedin = f"Hi {name}, noted your security leadership at {company} via {source}. We help Indian tech teams automate DPDP Act Section 8 breach safeguards and telemetry before May 2027. Would love to connect and share our technical benchmark."
        cited = ["Section 8"]

    elif "Founder" in persona_type or "CEO" in persona_type:
        body = (
            f"Hi {name},\n\n"
            f"I found your profile via {source} while following {company}'s impressive growth trajectory. "
            f"With statutory DPDP Act 2023 enforcement progressing toward May 2027, high-growth Indian startups face complex Section 5 notice mandates and Section 8 data retention rules. Statutory non-compliance penalties can reach up to ₹250 crore depending on the breach.\n\n"
            f"At RegulationFlow Technologies, we built DPDPFlow so corporate founders achieve turnkey compliance without maintaining an expensive in-house privacy engineering squad. "
            f"Could we share a concise 10-minute product tour tailored for {company}?\n\n"
            f"Best regards,\nAakash Verma, DPDPFlow\n\n"
            f"Unsubscribe: {{{{unsubscribe_link}}}}"
        )
        linkedin = f"Hi {name}, following {company} via {source}. We built DPDPFlow to help Indian startup founders handle DPDP Act Section 5 notices and data retention turnkey, avoiding costly privacy consultancies. Glad to connect!"
        cited = ["Section 5", "Section 8"]

    elif "Legal" in persona_type:
        body = (
            f"Dear {name},\n\n"
            f"I came across your legal leadership at {company} via {source}. "
            f"As Indian corporate organizations align with the DPDP Act 2023, Sections 5, 11, and 16 introduce strict statutory requirements around multilingual consent notices, principal rights workflows, and sovereign data controls. Regulatory penalties can reach up to ₹250 crore depending on the breach.\n\n"
            f"At RegulationFlow Technologies, DPDPFlow provides verifiable compliance audit trails and consent management infrastructure purpose-built for General Counsel teams. "
            f"Would you have 15 minutes next week to review our legal compliance architecture?\n\n"
            f"Warm regards,\nAakash Verma, DPDPFlow\n\n"
            f"Unsubscribe: {{{{unsubscribe_link}}}}"
        )
        linkedin = f"Dear {name}, noted your legal oversight at {company} via {source}. DPDPFlow automates DPDP Act Section 5 consent notices, Section 11 rights, and audit trails for Indian corporate legal teams. Look forward to connecting."
        cited = ["Section 5", "Section 11", "Section 16"]

    else: # DPO / Head of Compliance
        body = (
            f"Hi {name},\n\n"
            f"I found your contact through {source} while researching compliance initiatives across Indian industry leaders. "
            f"Ahead of full DPDP Act 2023 enforcement in May 2027, Section 8(7) mandates automated data minimisation and Section 10 requires tamper-evident audit readiness for fiduciaries. Statutory penalties can reach up to ₹250 crore depending on the breach.\n\n"
            f"At RegulationFlow Technologies, DPDPFlow equips privacy teams and DPOs with automated retention pipelines and ready-to-file board documentation. "
            f"Could we schedule a brief 15-minute briefing next week to share our readiness audit checklist?\n\n"
            f"Best regards,\nAakash Verma, DPDPFlow\n\n"
            f"Unsubscribe: {{{{unsubscribe_link}}}}"
        )
        linkedin = f"Hi {name}, found your contact via {source}. We assist Indian DPOs in operationalising DPDP Act Section 8 retention rules and Section 10 governance before May 2027 enforcement. Glad to connect and share our DPO audit pack."
        cited = ["Section 8", "Section 10"]

    return {
        "subject": subject,
        "email_body": body,
        "linkedin_note": linkedin[:300],
        "cited_sections": cited
    }
