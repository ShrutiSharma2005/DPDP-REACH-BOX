# DPDP Outreach Agent - System Architecture

## Architecture Overview

```
 [CSV Import / Public Sources]
              │
              ▼
    1. Prospect Finder Agent ───────────► Rejections Audit Log
              │ (ICP: India, 50-5k staff, Tech sectors, Lawful Basis)
              ▼
    2. Enricher Agent
              │ (DNS MX + Syntax Verification, Personal Domains Rejected)
              ▼
    3. Compliance Clearance Gate
              │ (Central Suppression Filter, Lawful Basis Validation)
              ▼
    4. Writer Agent ◄───────────────────► Local BM25 RAG
              │ (Groq Llama 3.3 / Offline Fallback)  (DPDP Act 2023 + DPDPFlow Facts)
              │
              ▼
    5. Fact Checker Gate (0 Factual Errors Enforcement)
              │ (Valid Sections 1-44, Banned Penalty Phrasing, 90-120 words)
              ▼
    6. Human Review Queue (Approve / Edit / Reject) ──► Few-Shot Edit Store
              │
              ▼
    7. Sender Agent (Cap: 30-50/day, Spacing, Warmup)
              │
              ├──► [DRY_RUN=true]  ──► Local Outbox Viewer
              └──► [DRY_RUN=false] ──► Verified SMTP
              │
              ▼
    8. Reply Tracker & Auto-Suppression
              │
              ├──► [Opt-Out]    ──► Instant Central Suppression List
              └──► [Interested] ──► Demo Booking Link (cal.com)
```

## Storage & Database Schema (SQLite via SQLAlchemy)
- `prospects`: Stores minimal contact metadata (name, role, company, work_email, sector, lawful basis, timestamps, unsubscribe token).
- `drafts`: Personalized emails, LinkedIn notes, retrieved citations, word counts, and reviewer feedback.
- `outbox`: Local dry-run and live dispatch log with recipient, subject, body, and status.
- `replies`: Inbound response bodies, classifications, confidence scores, and source provenance.
- `suppression_list`: Central opt-out ledger ensuring zero contact after unsubscribe or erasure request.
- `audit_logs`: Tamper-evident trail of all pipeline lifecycle events.

## Safety Defaults
1. `DRY_RUN=true` out-of-the-box: No external network packets leave the server.
2. `LEGAL_REVIEWED_TEMPLATES=false` lock: Switching off dry-run requires explicit confirmation.
3. Daily sending domain cap: Hard maximum 50/day with 45s minimum pacing.
