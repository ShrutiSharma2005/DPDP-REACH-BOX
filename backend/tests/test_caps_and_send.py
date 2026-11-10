import pytest
from app.db import SessionLocal, Base, engine
from app.models import Prospect, Draft, OutboxMessage, SuppressionEntry
from app.agents.sender import run_sender_agent
from app.config import settings



def test_dry_run_send_writes_to_outbox(db):
    settings.DRY_RUN = True
    p = Prospect(
        name="Test Lead",
        role="CISO",
        company="SecureCo",
        work_email="test.ciso@secureco.example",
        sector="fintech",
        source="Directory",
        lawful_basis="made_public_by_person",
        status="approved"
    )
    db.add(p)
    db.commit()

    d = Draft(
        prospect_id=p.id,
        persona="CISO",
        subject="DPDP Act readiness - SecureCo",
        email_body="Hi Test Lead,\n\nTest email body.\n\nUnsubscribe: {{unsubscribe_link}}",
        linkedin_note="Test note",
        fact_check_passed=True,
        status="approved"
    )
    db.add(d)
    db.commit()

    res = run_sender_agent(db, [d.id])
    assert res["status"] == "success"
    assert res["dispatched_count"] == 1

    outbox = db.query(OutboxMessage).filter(OutboxMessage.draft_id == d.id).first()
    assert outbox is not None
    assert outbox.status == "sent_dry_run"
    assert outbox.is_dry_run is True

def test_legal_signoff_gate_blocks_live_sending(db):
    settings.DRY_RUN = False
    settings.LEGAL_REVIEWED_TEMPLATES = False

    res = run_sender_agent(db)
    assert res["status"] == "blocked"
    assert "legal sign-off gate" in res["message"].lower()

    # Reset
    settings.DRY_RUN = True
