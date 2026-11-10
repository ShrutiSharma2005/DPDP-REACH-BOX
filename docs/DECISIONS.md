# Architecture & Compliance Decision Records (ADRs)

## ADR-01: Zero Scraping & Human-in-the-Loop LinkedIn Notes
- **Context**: The outreach strategy includes LinkedIn touches alongside email.
- **Decision**: Prohibit all automated LinkedIn scraping, bot logins, and automated DMs. LinkedIn notes are drafted strictly for manual copy-pasting by a human representative.
- **Rationale**: Complies with platform terms of service and prevents account suspension, while preserving genuine human-to-human relationship building.

## ADR-02: Mandatory Rejection of Personal Consumer Domains
- **Context**: DPDP Act compliance demands strict distinction between corporate identities made publicly available and private consumer communications.
- **Decision**: Reject all email addresses from consumer domains (`gmail.com`, `yahoo.com`, `outlook.com`, etc.) at the import gate.
- **Rationale**: Upholds DPDP Act Section 3(c)(ii)(A) integrity and protects the sender from consumer privacy complaints.

## ADR-03: Rejection of Non-Statutory "B2B Legitimate Interest"
- **Context**: GDPR Article 6(1)(f) recognizes "legitimate interest" for marketing, but the Indian DPDP Act 2023 contains NO such provision.
- **Decision**: Reject any prospect record claiming "legitimate interest" as a lawful basis. The only permissible bases are Section 3(c)(ii)(A) (`made_public_by_person`), Section 7(a) (`gave_voluntarily`), or Section 6 (`consented`).
- **Rationale**: Avoids adopting a non-existent statutory ground and ensures true legal defensibility under Indian law.

## ADR-04: Deterministic Keyword Rule Before LLM Classification
- **Context**: Opt-outs must be honored immediately to uphold statutory erasure rights.
- **Decision**: Keyword rules run with highest precedence before calling any LLM. If a known opt-out pattern matches, the contact is suppressed instantly.
- **Rationale**: Eliminates non-deterministic LLM failure risks and achieves 100% recall on explicit withdrawal requests.

## ADR-05: Fact Checker Gating with Hard Approval Block
- **Context**: LLMs tend to hallucinate section numbers or exaggerate statutory penalties (e.g. "₹250 crore per violation").
- **Decision**: The Fact Checker runs deterministically. Drafts with hallucinated sections or banned penalty phrasing cannot be approved in the UI.
- **Rationale**: Guarantees zero legal misrepresentations reach potential customers.
