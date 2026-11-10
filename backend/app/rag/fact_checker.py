import os
import re
from typing import Dict, Any, List, Tuple
from app.rag.ingest import get_valid_act_sections

BANNED_PHRASES = [
    r'(?:₹|rs\.?|inr)?\s*250\s*crore\s*(?:fine\s*)?per\s*violation',
    r'(?:₹|rs\.?|inr)?\s*250\s*cr\s*(?:fine\s*)?per\s*violation',
    r'2500000000\s*per\s*violation',
    r'guaranteed\s*exemption',
    r'b2b\s*legitimate\s*interest\s*ground',
    r'legitimate\s*interest\s*for\s*b2b\s*outreach'
]

REQUIRED_NOTICE_ELEMENTS = {
    "sender_identity": [
        r'\b(?:aakash|dpdpflow|regulationflow)\b'
    ],
    "source_attribution": [
        r'\b(?:source|directory|speaker|listing|attendee|forum|public|disclosed|roundtable|registry|cohort)\b',
        r'\b(?:found\s+your\s+profile|noted\s+your\s+role|contact\s+details\s+from)\b'
    ],
    "purpose_reason": [
        r'\b(?:dpdp|compliance|data\s+protection|audit|readiness|safeguards|consent|breach)\b'
    ],
    "unsubscribe_mechanism": [
        r'(?:unsubscribe|\{\{unsubscribe_link\}\}|unsubscribe_token|opt[\s-]out)'
    ]
}

def verify_draft(
    email_body: str,
    linkedin_note: str,
    knowledge_dir: str = None
) -> Tuple[bool, List[str], Dict[str, Any]]:
    """
    Verifies that a generated draft satisfies all legal, factual, and structural constraints:
    1. Every 'Section N' cited exists in the ingested DPDP Act text (DPDP Act has Sections 1-44).
    2. Banned phrases (e.g. '₹250 crore per violation') are strictly absent.
    3. Mandatory notice elements (sender identity, source, reason, unsubscribe mechanism) are present.
    4. Email word count is 90-120 words (relaxed 80-135 in tolerant check, but 90-120 standard).
    5. LinkedIn note length is <= 300 characters.
    """
    if knowledge_dir is None:
        base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        knowledge_dir = os.path.join(base_dir, "data", "knowledge")

    valid_sections = get_valid_act_sections(knowledge_dir)
    reasons = []
    
    # 1. Section citation check
    cited_sections = re.findall(r'\bSection\s+(\d+)', email_body + " " + linkedin_note, re.IGNORECASE)
    for sec_num in cited_sections:
        sec_name = f"Section {sec_num}"
        if sec_name not in valid_sections:
            reasons.append(f"Statutory hallucination: '{sec_name}' does not exist in DPDP Act 2023 (Act contains Sections 1-44).")

    # 2. Banned phrases check
    combined_text = f"{email_body}\n{linkedin_note}".lower()
    for pattern in BANNED_PHRASES:
        if re.search(pattern, combined_text, re.IGNORECASE):
            reasons.append(f"Banned phrase violation: Found inaccurate penalty/legal phrasing matching '{pattern}'. Use 'penalties can reach up to ₹250 crore depending on the breach'.")

    # 3. Required notice elements check
    for element_key, patterns in REQUIRED_NOTICE_ELEMENTS.items():
        matched = any(re.search(pat, combined_text, re.IGNORECASE) for pat in patterns)
        if not matched:
            human_label = element_key.replace("_", " ").title()
            reasons.append(f"Missing mandatory DPDP notice element: {human_label} is required.")

    # 4. Email word count check
    words = [w for w in re.findall(r'\b[\w\'-]+\b', email_body)]
    word_count = len(words)
    if word_count < 90 or word_count > 120:
        reasons.append(f"Email length constraint failed: {word_count} words (Must be between 90 and 120 words).")

    # 5. LinkedIn note character check
    linkedin_char_count = len(linkedin_note.strip())
    if linkedin_char_count > 300:
        reasons.append(f"LinkedIn note constraint failed: {linkedin_char_count} characters (Max allowed is 300 characters).")

    passed = len(reasons) == 0
    metrics = {
        "word_count": word_count,
        "linkedin_char_count": linkedin_char_count,
        "sections_cited": [f"Section {s}" for s in cited_sections],
        "passed": passed
    }

    return passed, reasons, metrics
