# DPDP Outreach Agent — Synthetic Testing Data Suite

This directory contains modular, synthetic test datasets specifically calibrated to test and benchmark every gate and agent in the **DPDP Outreach Agent** platform:

1. **Import Gate & ICP Validator** (`app/agents/finder.py`)
2. **Deliverability & MX Verifier** (`app/services/email_verify.py`)
3. **Statutory Compliance & Suppression Gate** (`app/agents/compliance.py`)
4. **Deterministic RAG Fact-Checker** (`app/rag/fact_checker.py`)
5. **Inbound Reply & Intent Classifier** (`app/agents/reply_tracker.py`)

> **RFC 2606 Safety Guarantee**: All prospect emails use reserved `.example` test domains (e.g. `finflow.example`, `careplus.example`). No real individuals are contacted, and all tests execute in offline dry-run mode.

---

## Directory Structure

```
test_data/
├── README.md                                          # This documentation guide
├── prospects/
│   ├── 01_valid_prospects_clean.csv                  # 35 clean, 100% compliant Indian enterprise leads
│   ├── 02_icp_and_compliance_gate_failures.csv        # 31 targeted test cases triggering every rejection rule
│   ├── 03_realistic_mixed_batch.csv                   # 50 rows (40 valid + 10 rejected) for UI validation
│   └── 04_boundary_and_normalization_cases.csv        # Boundary headcounts (50, 5000) & sector alias normalizations
├── replies/
│   ├── inbound_replies_benchmark.json                 # 40 labeled inbound replies across 4 intent classes
│   └── inbound_replies_benchmark.csv                  # Same labeled reply dataset in CSV format
└── fact_checker/
    └── fact_checker_test_suite.json                   # 9 comprehensive drafts testing clean vs 7 corruption vectors
```

---

## 1. Prospect Datasets & Statutory Rule Mapping

### `01_valid_prospects_clean.csv`
- **Purpose**: Verifies the "Happy Path" end-to-end.
- **Expected Outcome**: **100% Import Rate** (35/35 imported), **100% MX Verified**, **100% Cleared for Drafting**.
- **Coverage**:
  - Roles: DPO, CISO, Head of Legal, Head of Compliance, CTO, Founder & CEO.
  - In-Scope Sectors: Fintech, Health, Edtech, E-commerce, SaaS.
  - Valid Lawful Bases: `made_public_by_person` (s.3(c)(ii)(A)), `gave_voluntarily` (s.7(a)), `consented` (s.6).
  - Employee Count: 50 to 5,000 employees.
  - Phone numbers: None (strictly minimised).

### `02_icp_and_compliance_gate_failures.csv`
- **Purpose**: Rigorously tests that deliberate compliance and ICP violations are 100% caught and blocked.
- **Expected Outcome**: **100% Rejection Rate** (0 imported, 31 rejected).
- **Rule Verification Breakdown**:
  | Test Case Rows | Injected Defect | Governing Legal / ICP Constraint | Expected Gate Result |
  | :--- | :--- | :--- | :--- |
  | Rows 2–7 | Personal consumer domains (`@gmail.com`, `@yahoo.com`, `@outlook.com`, `@icloud.com`, `@rediffmail.com`) | Section 3(c)(ii)(A) Work Contact policy | **BLOCKED** by domain policy |
  | Rows 8–9 | Phone numbers present (`+919876543210`, `022-28765432`) | Data Minimisation (Section 8(7)) | **BLOCKED** with phone violation notice |
  | Rows 10–14 | Non-India countries (United States, United Kingdom, Singapore, UAE, Germany) | Target Geographic Boundary (India HQ) | **BLOCKED** with non-India reason |
  | Rows 15–18 | Out-of-bounds Headcounts (12, 49, 5001, 25000) | Target ICP 50–5,000 employee limit | **BLOCKED** with headcount bound reason |
  | Rows 19–23 | Unsupported Sectors (Automotive, Aviation, Mining, Agriculture, Construction) | In-Scope ICP Sectors (Fintech, Health, Edtech, E-commerce, SaaS) | **BLOCKED** with sector mismatch reason |
  | Rows 24–27 | Invalid Lawful Bases (`legitimate_interest`, `scraped_without_consent`, `purchased_list`, blank) | Section 4 & 6 Lawful Grounds (GDPR legitimate interest is invalid under DPDP Act) | **BLOCKED** & flagged as "needs legal ruling" |
  | Rows 28–32 | Syntax & Missing Fields (missing `@`, empty email, missing name/company) | Data Integrity & Presence validation | **BLOCKED** with syntax/presence error |

### `03_realistic_mixed_batch.csv`
- **Purpose**: Simulates a real-world messy CSV upload inside the Web UI (`/prospects`).
- **Expected Outcome**: **40 Imported**, **10 Blocked** (80.0% import success rate).
- **UI Verification**: Tests the import modal summary dialog displaying the exact list of rejected rows with actionable reasons.

### `04_boundary_and_normalization_cases.csv`
- **Purpose**: Validates boundary limits and sector alias normalizations.
- **Coverage**:
  - Exact boundary headcount `50` (passes) and `5000` (passes).
  - Normalization of sector aliases: `financial services` -> `fintech`, `healthtech`/`healthcare` -> `health`, `education` -> `edtech`, `retail`/`marketplace` -> `e-commerce`, `software` -> `SaaS`.
  - Country code aliases: `IN`, `india`, `India`.

---

## 2. Inbound Reply Classification Benchmark

### `replies/inbound_replies_benchmark.json` & `.csv`
Contains 40 labeled replies across 4 core intent classes:
1. **`opt_out`** (10 samples):
   - Direct keywords: *"stop"*, *"unsubscribe"*, *"cease communication"*.
   - Statutory DPDP Section 11 right to erasure: *"I demand immediate erasure of my contact records under DPDP Section 11"*.
   - **Expected System Action**: Automated classification as `opt_out`, instant insertion into `SuppressionEntry`, and blocking of all future outbound sends.
2. **`interested`** (10 samples):
   - Specific meeting requests: *"Let's connect next Tuesday at 3 PM IST"*.
   - Demo requests: *"Book a demo for our CISO team"*.
   - **Expected System Action**: Classified as `interested`, qualified lead status, and calendar URL presentation.
3. **`wrong_person`** (10 samples):
   - Referrals to DPO / CISO: *"I am the wrong person, contact our DPO Kavita at kavita@company.example"*.
   - **Expected System Action**: Classified as `wrong_person`, flags need for contact reassignment.
4. **`not_now`** (10 samples):
   - Budget constraints: *"No budget available for privacy tooling right now"*.
   - Audit cycles: *"Busy with ISO audit this quarter, check back in July"*.
   - **Expected System Action**: Classified as `not_now`, sets snooze reminder.

---

## 3. RAG Fact-Checker Benchmark

### `fact_checker/fact_checker_test_suite.json`
Benchmarks the deterministic fact-checker against 7 corruption vectors:
- **`FC-01` (Clean Draft)**: Verified 90–120 words, public directory attribution, Section 8/10 citations, accurate penalty ceiling ("penalties can reach up to ₹250 crore depending on the breach"), `{{unsubscribe_link}}`, <=300 char LinkedIn note. -> **PASSES**.
- **`FC-02` / `FC-03` (Hallucinated Sections)**: Cites Section 89 or Section 102 (Act has only 44 sections). -> **BLOCKED**.
- **`FC-04` (Banned Penalty Phrasing)**: Injects *"fines of ₹250 crore per violation"*. -> **BLOCKED**.
- **`FC-05` (Missing Unsubscribe)**: Omits `{{unsubscribe_link}}`. -> **BLOCKED**.
- **`FC-06` (Missing Source Attribution)**: Omits public provenance statement. -> **BLOCKED**.
- **`FC-07` (Word Count Underflow)**: Body has only 35 words (<90 words). -> **BLOCKED**.
- **`FC-08` (Word Count Overflow)**: Body has 165 words (>120 words). -> **BLOCKED**.
- **`FC-09` (LinkedIn Note Overflow)**: Note has 340 characters (>300 chars limit). -> **BLOCKED**.

---

## 4. How to Use the Testing Data

### Option A: Test via the Frontend Web UI
1. Start the app: `run.bat` (Windows) or `make dev` (macOS/Linux).
2. Open **[http://localhost:5173](http://localhost:5173)** in your browser.
3. Go to **Prospects & ICP Gate** (`/prospects`):
   - Click **"Upload CSV"**.
   - Select `test_data/prospects/03_realistic_mixed_batch.csv`.
   - Observe the real-time Validation Report modal showing 40 imported vs 10 rejected with explicit reasons.
4. Go to **Replies** (`/replies`):
   - In the "Simulate Inbound Reply" box, copy/paste any test phrase from `test_data/replies/inbound_replies_benchmark.csv`.
   - Submit the reply and observe instant intent tagging and automatic suppression ledger updates.

### Option B: Run Automated Evaluations via Backend CLI
```bash
# Run the complete benchmark evaluation suite
cd backend
./venv/Scripts/python ../scripts/eval.py
```

### Option C: Run Pytest Test Suite
```bash
cd backend
./venv/Scripts/pytest
```

### Option D: Generate Custom Dynamic Test Data
```bash
# Generate 100 fresh prospects with an 80% valid / 20% invalid mix
python scripts/generate_test_data.py --prospects --count 100 --output test_data/prospects/custom_100.csv
```
