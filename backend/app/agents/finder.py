import csv
import io
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models import Prospect
from app.services.audit import log_audit_event

ALLOWED_SECTORS = {"fintech", "health", "edtech", "e-commerce", "saas", "healthtech", "ecommerce"}

def normalize_sector(sector: str) -> str:
    s = sector.strip().lower().replace("-", "").replace(" ", "")
    if s in ["fintech", "financialservices"]:
        return "fintech"
    if s in ["health", "healthtech", "healthcare"]:
        return "health"
    if s in ["edtech", "education"]:
        return "edtech"
    if s in ["ecommerce", "retail", "marketplace"]:
        return "e-commerce"
    if s in ["saas", "software"]:
        return "SaaS"
    return sector.strip()

def process_csv_import(
    db: Session,
    csv_content: str,
    column_mapping: Dict[str, str] = None
) -> Tuple[List[Prospect], List[Dict[str, Any]]]:
    """
    Parses CSV, maps columns, applies strict ICP filters:
    - India HQ
    - 50 to 5,000 employees
    - In-scope sectors: fintech, health, edtech, e-commerce, SaaS
    - Work contacts only (no phone fields allowed)
    - Mandatory lawful basis check
    - Deduplication against existing DB
    """
    reader = csv.DictReader(io.StringIO(csv_content))
    imported_prospects: List[Prospect] = []
    rejected_rows: List[Dict[str, Any]] = []

    # Default header mapping if none provided
    col_map = {
        "name": "name",
        "role": "role",
        "company": "company",
        "work_email": "work_email",
        "country": "country",
        "employee_count": "employee_count",
        "sector": "sector",
        "source": "source",
        "lawful_basis": "lawful_basis",
        "recent_trigger": "recent_trigger",
        "phone": "phone"
    }
    if column_mapping:
        col_map.update(column_mapping)

    existing_emails = set(e[0].lower() for e in db.query(Prospect.work_email).all())

    for row_idx, row in enumerate(reader, start=2): # line 1 is header
        # Map fields
        name = row.get(col_map.get("name", "name"), "").strip()
        role = row.get(col_map.get("role", "role"), "").strip()
        company = row.get(col_map.get("company", "company"), "").strip()
        work_email = row.get(col_map.get("work_email", "work_email"), "").strip().lower()
        country = row.get(col_map.get("country", "country"), "India").strip()
        emp_raw = row.get(col_map.get("employee_count", "employee_count"), "100").strip()
        sector_raw = row.get(col_map.get("sector", "sector"), "").strip()
        source = row.get(col_map.get("source", "source"), "").strip()
        lawful_basis = row.get(col_map.get("lawful_basis", "lawful_basis"), "").strip()
        recent_trigger = row.get(col_map.get("recent_trigger", "recent_trigger"), "").strip()
        phone = row.get(col_map.get("phone", "phone"), "").strip()

        # Rule 1: Reject phone numbers or phone fields with content
        if phone:
            rejected_rows.append({
                "row": row_idx,
                "email": work_email,
                "name": name,
                "reason": "Compliance violation: Phone numbers strictly disallowed under data minimisation rules."
            })
            continue

        # Rule 2: Basic presence
        if not name or not work_email or not company:
            rejected_rows.append({
                "row": row_idx,
                "email": work_email or "(missing)",
                "name": name or "(missing)",
                "reason": "Missing mandatory field (name, work_email, or company)."
            })
            continue

        # Rule 3: Deduplication
        if work_email in existing_emails:
            rejected_rows.append({
                "row": row_idx,
                "email": work_email,
                "name": name,
                "reason": "Duplicate contact: Email already exists in database."
            })
            continue

        # Rule 4: ICP Filter - Country must be India
        if country.lower() not in ["india", "in"]:
            rejected_rows.append({
                "row": row_idx,
                "email": work_email,
                "name": name,
                "reason": f"ICP Filter failed: Country '{country}' is not India."
            })
            continue

        # Rule 5: ICP Filter - Employee count (50 to 5,000)
        try:
            emp_count = int(emp_raw) if emp_raw else 100
        except ValueError:
            emp_count = 100
        
        if emp_count < 50 or emp_count > 5000:
            rejected_rows.append({
                "row": row_idx,
                "email": work_email,
                "name": name,
                "reason": f"ICP Filter failed: Employee count ({emp_count}) outside target 50–5,000 range."
            })
            continue

        # Rule 6: ICP Filter - Sector
        norm_sector = normalize_sector(sector_raw)
        if norm_sector.lower() not in ALLOWED_SECTORS:
            rejected_rows.append({
                "row": row_idx,
                "email": work_email,
                "name": name,
                "reason": f"ICP Filter failed: Sector '{sector_raw}' not in target sectors (fintech, health, edtech, e-commerce, SaaS)."
            })
            continue

        # Rule 7: Mandatory Lawful Basis Check
        valid_bases = {"made_public_by_person", "gave_voluntarily", "consented"}
        if lawful_basis not in valid_bases:
            rejected_rows.append({
                "row": row_idx,
                "email": work_email,
                "name": name,
                "reason": f"Invalid lawful basis '{lawful_basis}'. Must be one of: made_public_by_person, gave_voluntarily, consented. Flagged as 'needs legal ruling'."
            })
            continue

        # Passed Finder Gate
        prospect = Prospect(
            name=name,
            role=role,
            company=company,
            work_email=work_email,
            country="India",
            employee_count=emp_count,
            sector=norm_sector,
            source=source or "Public Leadership Directory",
            lawful_basis=lawful_basis,
            recent_trigger=recent_trigger or None,
            status="imported"
        )
        db.add(prospect)
        existing_emails.add(work_email)
        imported_prospects.append(prospect)

    db.commit()

    if imported_prospects:
        log_audit_event(
            db,
            event_type="PROSPECT_IMPORT",
            actor="finder_agent",
            details={
                "imported_count": len(imported_prospects),
                "rejected_count": len(rejected_rows)
            }
        )

    return imported_prospects, rejected_rows
