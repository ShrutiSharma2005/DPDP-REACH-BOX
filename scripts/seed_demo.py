import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Ensure backend is on sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BACKEND_DIR = os.path.join(BASE_DIR, "backend")
sys.path.insert(0, BACKEND_DIR)

from app.db import SessionLocal, engine, Base
from app.models import Prospect, Draft, OutboxMessage, Reply, SuppressionEntry
from app.agents.finder import process_csv_import
from app.agents.enricher import enrich_and_verify_prospects
from app.agents.compliance import run_compliance_check
from app.agents.writer import run_writer_agent
from app.agents.sender import run_sender_agent
from app.agents.reply_tracker import record_incoming_reply

def seed_demo_data():
    print("🌱 Starting DPDP Outreach Agent demo data seeding...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data for fresh demo seed
    db.query(OutboxMessage).delete()
    db.query(Reply).delete()
    db.query(Draft).delete()
    db.query(Prospect).delete()
    db.query(SuppressionEntry).delete()
    db.commit()

    # 1. Import synthetic prospects
    csv_path = os.path.join(BACKEND_DIR, "data", "synthetic_prospects.csv")
    if not os.path.exists(csv_path):
        print(f"❌ Synthetic prospects CSV not found at {csv_path}")
        return

    with open(csv_path, "r", encoding="utf-8") as f:
        csv_text = f.read()

    imported, rejected = process_csv_import(db, csv_text)
    print(f"✅ Imported {len(imported)} valid prospects (Rejected {len(rejected)} invalid test rows).")

    # 2. Enrich & Verify
    enrich_res = enrich_and_verify_prospects(db)
    print(f"✅ Email deliverability verification: {enrich_res['verified_count']} verified, {enrich_res['rejected_count']} rejected.")

    # 3. Compliance Clearance Gate
    comp_res = run_compliance_check(db)
    print(f"✅ Compliance Gate: {comp_res['cleared_count']} cleared for message drafting.")

    # 4. Generate Drafts
    draft_res = run_writer_agent(db)
    print(f"✅ Writer Agent: {draft_res['drafts_generated']} personalized drafts generated ({draft_res['fact_check_passed_count']} passed fact-checker).")

    # 5. Approve initial batch of compliant drafts (e.g. first 20)
    passed_drafts = db.query(Draft).filter(Draft.fact_check_passed == True).limit(20).all()
    for d in passed_drafts:
        d.status = "approved"
        if d.prospect:
            d.prospect.status = "approved"
    db.commit()
    print(f"✅ Approved initial batch of {len(passed_drafts)} drafts.")

    # 6. Dispatch Dry-Run Sends for first 15 approved drafts
    send_res = run_sender_agent(db)
    print(f"✅ Sender Agent: {send_res['dispatched_count']} emails dispatched to local outbox (DRY RUN).")

    # 7. Seed inbound replies to demonstrate reply classifier & auto-suppression
    sample_replies = [
        {
            "email": "aarav.sharma@finflow.example",
            "body": "Hi Aakash, this is very timely. We are looking at Section 8 audit readiness right now. Let's schedule a demo next Tuesday at 3 PM IST.",
            "subject": "Re: DPDP Act readiness - FinFlow Technologies"
        },
        {
            "email": "priya.patel@healthnest.example",
            "body": "Please book a demo with our privacy council. Could you send the calendar invite for Thursday?",
            "subject": "Re: Section 5 notices"
        },
        {
            "email": "vikram.malhotra@eduscale.example",
            "body": "Not right now, please check back with us next quarter when our budget cycles open.",
            "subject": "Re: ISO 27001 update"
        },
        {
            "email": "ananya.iyer@cartcraft.example",
            "body": "I am no longer handling compliance here. Please reach out to our new Head of Legal, Karan Mehta.",
            "subject": "Re: CartCraft compliance"
        },
        {
            "email": "rohan.desai@cloudmetric.example",
            "body": "Unsubscribe immediately. Please remove me and delete my data from your contact records.",
            "subject": "Re: CloudMetric Labs telemetry"
        }
    ]

    for rep in sample_replies:
        record_incoming_reply(db, rep["email"], rep["body"], rep["subject"])

    print(f"✅ Seeded {len(sample_replies)} realistic replies (including 1 automated opt-out suppression).")
    print("🚀 Seed complete! Database is fully populated for immediate browser demonstration.")
    db.close()

if __name__ == "__main__":
    seed_demo_data()
