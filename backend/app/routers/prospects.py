import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db import get_db
from app.models import Prospect
from app.schemas import ProspectResponse, ImportReportResponse
from app.agents.finder import process_csv_import
from app.agents.enricher import enrich_and_verify_prospects
from app.agents.compliance import run_compliance_check

router = APIRouter(prefix="/api/prospects", tags=["Prospects"])

@router.get("", response_model=List[ProspectResponse])
def get_prospects(
    status: Optional[str] = Query(None),
    sector: Optional[str] = Query(None),
    lawful_basis: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Prospect)
    if status:
        query = query.filter(Prospect.status == status)
    if sector:
        query = query.filter(func.lower(Prospect.sector) == sector.lower())
    if lawful_basis:
        query = query.filter(Prospect.lawful_basis == lawful_basis)
    if search:
        s = f"%{search}%"
        query = query.filter(
            (Prospect.name.ilike(s)) |
            (Prospect.company.ilike(s)) |
            (Prospect.work_email.ilike(s)) |
            (Prospect.role.ilike(s))
        )
    return query.order_by(Prospect.id.desc()).all()

@router.post("/import", response_model=ImportReportResponse)
async def import_prospects_csv(
    file: UploadFile = File(...),
    column_mapping_json: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    try:
        content = await file.read()
        csv_text = content.decode("utf-8-sig")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read CSV file: {str(e)}")

    col_map = {}
    if column_mapping_json:
        try:
            col_map = json.loads(column_mapping_json)
        except Exception:
            pass

    imported, rejected = process_csv_import(db, csv_text, col_map)
    return {
        "total_rows": len(imported) + len(rejected),
        "imported_count": len(imported),
        "rejected_count": len(rejected),
        "rejected_details": rejected
    }

@router.post("/enrich")
def enrich_prospects(
    prospect_ids: Optional[List[int]] = None,
    db: Session = Depends(get_db)
):
    result = enrich_and_verify_prospects(db, prospect_ids)
    return result

@router.post("/compliance-check")
def compliance_check(
    prospect_ids: Optional[List[int]] = None,
    db: Session = Depends(get_db)
):
    result = run_compliance_check(db, prospect_ids)
    return result

@router.delete("/{prospect_id}")
def delete_prospect(prospect_id: int, db: Session = Depends(get_db)):
    p = db.query(Prospect).filter(Prospect.id == prospect_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Prospect not found")
    db.delete(p)
    db.commit()
    return {"status": "deleted", "id": prospect_id}
