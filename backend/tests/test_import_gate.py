import pytest
from app.db import SessionLocal, Base, engine
from app.agents.finder import process_csv_import
from app.models import Prospect



def test_import_valid_prospect(db):
    csv_content = """name,role,company,work_email,country,employee_count,sector,source,lawful_basis,recent_trigger,phone
Rahul Verma,DPO,FinSecure Labs,rahul.verma@finsecure.example,India,200,fintech,Public Directory,made_public_by_person,Audit readiness,
"""
    imported, rejected = process_csv_import(db, csv_content)
    assert len(imported) == 1
    assert len(rejected) == 0
    assert imported[0].work_email == "rahul.verma@finsecure.example"
    assert imported[0].lawful_basis == "made_public_by_person"

def test_reject_phone_number(db):
    csv_content = """name,role,company,work_email,country,employee_count,sector,source,lawful_basis,recent_trigger,phone
Suresh Pillai,CTO,CloudCorp,suresh@cloudcorp.example,India,150,SaaS,Directory,made_public_by_person,None,+919876543210
"""
    imported, rejected = process_csv_import(db, csv_content)
    assert len(imported) == 0
    assert len(rejected) == 1
    assert "phone" in rejected[0]["reason"].lower()

def test_reject_personal_domain(db):
    # Personal domain is rejected by finder or enricher
    from app.services.email_verify import is_personal_email_domain
    assert is_personal_email_domain("test@gmail.com") is True
    assert is_personal_email_domain("test@yahoo.com") is True
    assert is_personal_email_domain("test@outlook.com") is True
    assert is_personal_email_domain("test@company.example") is False

def test_reject_invalid_lawful_basis(db):
    csv_content = """name,role,company,work_email,country,employee_count,sector,source,lawful_basis,recent_trigger,phone
Aarti Sen,CISO,ShopNet,aarti@shopnet.example,India,300,e-commerce,Sales,legitimate_interest,None,
"""
    imported, rejected = process_csv_import(db, csv_content)
    assert len(imported) == 0
    assert len(rejected) == 1
    assert "needs legal ruling" in rejected[0]["reason"].lower() or "invalid lawful basis" in rejected[0]["reason"].lower()

def test_reject_out_of_range_employee_count(db):
    csv_content = """name,role,company,work_email,country,employee_count,sector,source,lawful_basis,recent_trigger,phone
Tiny Leader,Founder,SmallCo,tiny@smallco.example,India,15,SaaS,Public,made_public_by_person,None,
"""
    imported, rejected = process_csv_import(db, csv_content)
    assert len(imported) == 0
    assert len(rejected) == 1
    assert "employee count" in rejected[0]["reason"].lower()
