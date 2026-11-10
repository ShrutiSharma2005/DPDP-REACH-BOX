import pytest
from app.db import SessionLocal, Base, engine
from app.models import Prospect, SuppressionEntry
from app.agents.compliance import run_compliance_check
from app.agents.retention import run_retention_cleanup
from datetime import datetime, timedelta



def test_suppression_blocks_prospect(db):
    supp = SuppressionEntry(email="blocked@fintech.example", reason="one_click_unsubscribe")
    db.add(supp)
    p = Prospect(
        name="Blocked Person",
        role="DPO",
        company="Fintech Corp",
        work_email="blocked@fintech.example",
        sector="fintech",
        source="Directory",
        lawful_basis="made_public_by_person",
        status="verified"
    )
    db.add(p)
    db.commit()

    res = run_compliance_check(db, [p.id])
    assert res["cleared_count"] == 0
    assert res["blocked_count"] == 1
    assert p.status == "suppressed"

def test_90_day_retention_purges_unengaged(db):
    old_time = datetime.utcnow() - timedelta(days=95)
    old_prospect = Prospect(
        name="Old Contact",
        role="CTO",
        company="StaleCo",
        work_email="old@staleco.example",
        sector="SaaS",
        source="Public",
        lawful_basis="made_public_by_person",
        status="imported",
        created_at=old_time
    )
    db.add(old_prospect)
    db.commit()

    cleanup_res = run_retention_cleanup(db, retention_days=90)
    assert cleanup_res["purged_count"] >= 1
    remaining = db.query(Prospect).filter(Prospect.work_email == "old@staleco.example").first()
    assert remaining is None
