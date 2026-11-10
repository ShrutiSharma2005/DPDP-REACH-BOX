# DPDP Act 2023 Statutory Compliance Mapping

This document provides an exhaustive, section-by-section legal mapping between each technical control implemented in **DPDP Outreach Agent** and the statutory provisions of the **Digital Personal Data Protection Act, 2023 (Act No. 22 of 2023)**.

---

## Statutory Mapping Matrix

| Technical Control in Code | DPDP Act 2023 Section | Statutory Requirement | How Our Agent Implements It |
| :--- | :--- | :--- | :--- |
| **Work Contacts Only Policy** | **Section 3(c)(ii)(A)** | Personal data made publicly available by the Data Principal is exempt from certain processing restrictions. | Personal consumer domains (`gmail.com`, `yahoo.com`, `outlook.com`) and all telephone fields are strictly blocked at import. Only public, professional corporate identities with established provenance are stored. |
| **Mandatory Lawful Basis Gate** | **Section 4 & Section 7(a)** | Processing digital personal data requires valid lawful consent or recognized legitimate uses. | Every prospect MUST have a specified statutory basis (`made_public_by_person`, `gave_voluntarily`, or `consented`). Rows with invalid or invented bases (e.g. "legitimate interest for B2B outreach", which does not exist in the Act) are rejected and flagged as "needs legal ruling". |
| **Notice Disclosures in Outreach** | **Section 5(1) & Section 5(2)** | Clear and itemised notice specifying purpose, sender identity, and manner of exercising rights. | Every generated email and LinkedIn message explicitly identifies the sender (**Aakash Verma at DPDPFlow**), the exact source where the contact was obtained, the legitimate purpose of outreach, and the grievance/opt-out path. |
| **One-Click Unsubscribe & Right to Withdraw Consent** | **Section 6(4)** | The Data Principal has the right to withdraw consent with the ease of giving it. | A direct one-click unsubscribe URL (`{{unsubscribe_link}}` -> `/api/unsubscribe/:token`) is present in every outbound message. Clicking it immediately registers the email on the central suppression list without login or survey hurdles. |
| **Pre-Send Suppression Check (Hard Stop)** | **Section 6(4) & Section 8(7)** | Immediate cessation of processing upon consent withdrawal or opt-out. | Before any email is dispatched by the Sender Agent, the recipient is checked against `SuppressionEntry`. If present, the dispatch is aborted instantly with no possibility of manual override. |
| **Automated Opt-Out Extraction in Replies** | **Section 11(2)** | Data Principal's right to correction and erasure. | All inbound replies are parsed by deterministic keyword rules first, followed by Groq LLM classification. Any request containing opt-out sentiment ("stop", "remove me", "not interested", "delete my data") triggers immediate automatic entry into the central suppression list. |
| **90-Day Retention & Purpose Purge** | **Section 8(7)** | A Data Fiduciary must erase personal data as soon as the specified purpose is no longer served. | An automated background job and UI trigger purge unengaged prospects after 90 days. Deletion details (timestamp, source, entity ID) are permanently recorded in the immutable audit log table. |
| **Human-In-The-Loop Approval Gate** | **Section 8(1)** | Data Fiduciary accountability for all processing and representations. | No message is ever dispatched autonomously. Every draft must be explicitly approved or edited by a human reviewer in the UI. Keyboard shortcuts (A / E / R) and batch approvals streamline reviewer oversight while maintaining strict fiduciary accountability. |
| **Fact Checker Against Statutory Hallucination** | **Section 33 & The Schedule** | Accuracy of regulatory representations; strict adherence to penalty definitions. | The Fact Checker verifies that: (a) cited sections exist in the ingested DPDP Act (Sections 1–44); (b) the banned phrase "₹250 crore per violation" is blocked and replaced with "penalties can reach up to ₹250 crore depending on the breach"; (c) mandatory notices exist; (d) length is strictly 90–120 words. |
| **Legal Review Sign-Off Gate** | **Section 8(5)** | Reasonable safeguards and governance before operational deployment. | A mandatory Settings toggle ("Legal reviewed message templates") must be activated before live sending can be enabled. A persistent high-visibility warning banner is displayed whenever legal sign-off has not been granted. |
| **Immutable Audit Logging** | **Section 10(2)(b)** | Maintenance of auditable records for regulatory inspection and board reporting. | The `AuditLog` table records all key events (`PROSPECT_IMPORT`, `VERIFICATION`, `COMPLIANCE_CLEARANCE`, `DRAFT_GENERATION`, `HUMAN_APPROVAL`, `SEND_DISPATCH`, `SUPPRESSION_ADDED`, `RETENTION_PURGE`) with timestamp, actor, and payload details. |

---

## Statutory Timelines & Implementation Notes
- **DPDP Rules Notified**: 13 November 2025 *(Target date for subordinate legislation)*.
- **Consent Manager Framework**: 13 November 2026.
- **Full Obligations & Penalty Enforcement**: 13 May 2027.
- *Notice displayed in application UI*: "Dates to be confirmed against the finalized Rules, 2025 before live go-live."
