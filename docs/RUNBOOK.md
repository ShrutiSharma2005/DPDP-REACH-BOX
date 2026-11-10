# DPDP Outreach Agent - Operational Runbook

## Overview
This runbook guides operators through daily execution, prospect importing, draft reviewing, send pacing, and suppression management.

---

## 1. Daily Workflow in 5 Steps

### Step 1: Ingest & Import Prospects
1. Navigate to the **Prospects** page.
2. Drag and drop your prospect CSV or click **Import Synthetic Demo Set**.
3. Inspect the **Validation Report**: verify that consumer domains, phone numbers, and invalid lawful bases were blocked.
4. Click **Verify & Enrich**: runs syntax and DNS MX records check.

### Step 2: Compliance Clearance
1. Click **Run Compliance Gate**:
   - Compares emails against central suppression list.
   - Clears prospects with valid statutory bases (`made_public_by_person`, `gave_voluntarily`, `consented`).

### Step 3: Generate Drafts
1. Click **Generate Drafts** (Writer Agent):
   - Retrieves DPDP Act citations and platform facts via local BM25.
   - Formulates 90–120 word email drafts and <=300 character LinkedIn connection notes.
   - Runs Fact Checker: automatically flags any non-compliant drafts.

### Step 4: Human Review & Approval
1. Navigate to the **Review Queue** (`/review`).
2. Review drafts using keyboard shortcuts:
   - Press **A**: Approve draft.
   - Press **E**: Edit draft inline (automatically re-checks word count and fact integrity).
   - Press **R**: Reject draft.
3. Reviewer edits are automatically saved and incorporated as few-shot in-context examples for subsequent generations!
4. Use **Copy LinkedIn Note** to copy the note for manual posting on LinkedIn (no bots or automated scrapers).

### Step 5: Send Dispatch & Outbox
1. Navigate to **Send Queue & Outbox** (`/outbox`).
2. Inspect today's send cap usage (default 30, maximum 50).
3. Click **Dispatch Queue**:
   - In **DRY RUN** mode (default): emails are stored in the local outbox viewer.
   - In **LIVE** mode: emails are sent via verified SMTP.

---

## 2. Inbound Reply Tracking & Opt-Out Handling
1. When a prospect replies, navigate to **Replies** (`/replies`).
2. Paste the reply body and sender email.
3. The hybrid classifier (keyword-first + Groq LLM) determines the category:
   - `interested`: Directs you to the demo booking link (`cal.com/dpdpflow/...`).
   - `opt_out`: Automatically adds the contact to the central suppression list and marks the prospect as `opted_out`.
   - `wrong_person`: Prompts you to update contact with the referred colleague.
   - `not_now`: Schedules a deferred touchpoint.

---

## 3. Data Minimisation Cleanup (Section 8(7))
1. Navigate to **Settings** (`/settings`).
2. Click **Run 90-Day Retention Cleanup**:
   - Automatically purges all unengaged contacts older than the configured threshold.
   - Logs details to the immutable audit trail.
