# DPDP Act Pre-Launch Compliance Checklist

Before switching `DRY_RUN` from `true` to `false` in production, legal and privacy officers must complete this checklist:

- [ ] **1. Domain DNS Configuration**
  - [ ] SPF record published (`v=spf1 include:... ~all`).
  - [ ] DKIM 2048-bit key configured on sending subdomain (`mail.dpdpflow.com`).
  - [ ] DMARC policy active (`p=quarantine` or `p=reject`).
- [ ] **2. Lawful Basis Audit**
  - [ ] All imported prospect records cite a statutory basis under the Act:
    - `made_public_by_person` (Section 3(c)(ii)(A))
    - `gave_voluntarily` (Section 7(a))
    - `consented` (Section 6)
  - [ ] Confirm no prospect record relies on a non-statutory "legitimate interest for B2B cold email" defense.
- [ ] **3. Required Message Disclosures**
  - [ ] Sender corporate identity is clearly stated (**Aakash Verma at RegulationFlow Technologies**).
  - [ ] Contact acquisition source is specifically stated.
  - [ ] Purpose of outreach is clearly defined.
  - [ ] One-click unsubscribe link is functional and renders without authentication.
- [ ] **4. Fact-Checker Enforcement**
  - [ ] Ensure 0 factual errors in review queue.
  - [ ] Verify statutory penalty phrasing: "penalties can reach up to ₹250 crore depending on the breach".
  - [ ] Confirm no draft cites non-existent sections outside Sections 1–44.
- [ ] **5. Suppression & Erasure Verification**
  - [ ] Suppression table is populated and checked prior to every send.
  - [ ] 90-day retention schedule is configured and audited.
- [ ] **6. Legal Sign-Off**
  - [ ] General Counsel or appointed Data Protection Officer has reviewed message templates and toggled **"Legal reviewed message templates"** in Settings.
