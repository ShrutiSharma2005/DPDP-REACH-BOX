# DPDPFlow Outreach Agent (RegulationFlow Technologies)

An AI agent system that finds decision-makers at Indian enterprises (DPO, CISO, Head of Legal/Compliance, CTO, Founders), writes personalized emails about the **Digital Personal Data Protection Act, 2023 (DPDP Act 2023)** and **DPDPFlow** (dpdpflow.com), and sends only after a human approves.

> **Legal Core**: It follows the law it sells. Enforces Section 3(c)(ii)(A) work contacts only, mandatory lawful bases, zero personal domains, one-click unsubscribe with instant suppression, and deterministic fact-checking.

---

## Quick Setup Guide (Under 10 Steps)

1. **Clone / Navigate to Repository**:
   ```bash
   cd dpdp-outreach-agent
   ```

2. **Copy Environment Configuration**:
   ```bash
   cp .env.example .env
   ```

3. **Add Your Free Groq API Key** *(Optional - offline fallback is active)*:
   - Open `.env` in any text editor.
   - Paste your key on line 3:
     ```env
     GROQ_API_KEY=gsk_your_groq_api_key_here
     ```
   - *(Free tier from console.groq.com. If left blank, deterministic compliant offline templates run automatically).*

4. **Run Automated Setup**:
   ```bash
   # On Windows
   run.bat

   # Or on macOS / Linux
   make setup && make dev
   ```

5. **Open Frontend Web Application**:
   - Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

6. **Seed Initial Demo Data**:
   - Click the green **"🌱 Seed Demo"** button in the top navigation bar, or run:
     ```bash
     cd backend && ./venv/Scripts/python ../scripts/seed_demo.py
     ```

7. **Review & Approve Personalized Drafts**:
   - Go to **Drafts & Review** (`/drafts`).
   - Use keyboard shortcuts: **A** (Approve), **E** (Edit inline), **R** (Reject).
   - Click **Copy LinkedIn note** to copy 300-char connection notes for manual sending.

8. **Dispatch Sends (Safe by Default)**:
   - Go to **Send Queue & Outbox** (`/outbox`).
   - Click **Dispatch Approved**. Since `DRY_RUN=true` by default, all emails are safely recorded to the local outbox viewer.

9. **Test Inbound Replies & Instant Suppression**:
   - Go to **Replies** (`/replies`).
   - Submit an opt-out: verified automatic suppression is added immediately.
   - Submit an interested reply: qualifies the lead and displays the demo booking URL.

10. **Run Comprehensive Empirical Evaluation**:
    ```bash
    cd backend && ./venv/Scripts/python ../scripts/eval.py
    ```

---

## Visual Walkthrough & Screenshots Section

| Screen | Description |
| :--- | :--- |
| **Command Center Dashboard** | Real-time KPI cards vs targets, statutory enactment countdown banner, pipeline funnel bar chart, and sector distributions. |
| **Guided Checklist** | 9-step first-run onboarding progress tracker taking non-technical operators through the complete compliance lifecycle. |
| **Prospects & ICP Gate** | Drag-and-drop CSV upload, validation report dialog, work deliverability verification, and statutory lawful basis tagging. |
| **Drafts & Review Queue** | Side-by-side view of email body, <=300 char LinkedIn notes, retrieved DPDP Act citations, fact-check pass/fail reasons, and keyboard shortcuts (`A`/`E`/`R`). |
| **Send Queue & Outbox** | Daily domain cap gauge (max 50/day), spacing pacing, and local outbox inspector displaying rendered emails and 1-click unsubscribe links. |
| **Inbound Replies & Intent Router** | Keyword-first opt-out classifier with instant suppression ledger integration and calendar demo routing. |
| **Suppression & Immutable Audit Trail** | Searchable central suppression list with CSV export and regulatory tamper-evident audit logs. |
| **Compliance Configuration** | Legal sign-off gate (blocking live sends until approved), Groq model selections, sender notice identities, and 90-day retention cleanup. |
| **Public 1-Click Unsubscribe** | Lightweight public page (`/unsubscribe/:token`) confirming instant erasure and suppression without requiring authentication. |

---

## Architectural Controls & Compliance Mapping

- **Work Contacts Only (Section 3(c)(ii)(A))**: Rejects all personal consumer domains (`gmail.com`, `yahoo.com`, `outlook.com`) and all telephone fields.
- **Mandatory Lawful Basis**: Requires one of `made_public_by_person`, `gave_voluntarily` (s.7(a)), or `consented` (s.6). Blocks invalid bases and flags as "needs legal ruling".
- **Fact-Checker Gate**: Verifies section citations against Sections 1–44, blocks banned "₹250 crore per violation" phrasing (replaces with "penalties can reach up to ₹250 crore depending on the breach"), verifies mandatory notice elements, and checks 90–120 word limits.
- **Legal Sign-Off Gate**: A settings toggle "Legal reviewed message templates" must be turned on before `DRY_RUN` can be disabled.
- **Data Minimisation (Section 8(7))**: 90-day retention cleanup purges unengaged prospects with full audit log trails.

For detailed mappings, refer to [docs/ACT_COMPLIANCE_MAP.md](docs/ACT_COMPLIANCE_MAP.md) and [docs/EVALUATION.md](docs/EVALUATION.md).
