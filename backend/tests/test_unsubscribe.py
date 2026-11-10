import pytest
from app.db import SessionLocal, Base, engine
from app.models import Prospect, SuppressionEntry
from app.routers.unsubscribe import handle_unsubscribe



def test_public_unsubscribe_adds_to_suppression(db):
    p = Prospect(
        name="Unsub User",
        role="DPO",
        company="UnsubCo",
        work_email="unsub@unsubco.example",
        sector="fintech",
        source="Public",
        lawful_basis="made_public_by_person",
        status="sent"
    )
    db.add(p)
    db.commit()

    res = handle_unsubscribe(p.unsubscribe_token, db)
    assert res["status"] == "success"

    supp = db.query(SuppressionEntry).filter(SuppressionEntry.email == "unsub@unsubco.example").first()
    assert supp is not None
    assert supp.reason == "one_click_unsubscribe"

    # Verify prospect status updated
    updated_p = db.query(Prospect).filter(Prospect.id == p.id).first()
    assert updated_p.status == "opted_out"
