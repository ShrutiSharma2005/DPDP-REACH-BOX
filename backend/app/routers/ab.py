from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, List
from app.db import get_db
from app.models import Draft, Prospect, Reply, OutboxMessage
from app.llm.prompts import AB_VARIANTS

router = APIRouter(prefix="/api/ab-tests", tags=["A/B Tests"])

@router.get("")
def get_ab_test_results(db: Session = Depends(get_db)) -> Dict[str, Any]:
    variants_data = []
    
    # Calculate performance per variant
    for var_id, meta in AB_VARIANTS.items():
        total_drafted = db.query(Draft).filter(Draft.ab_variant == var_id).count()
        approved = db.query(Draft).filter(Draft.ab_variant == var_id, Draft.status.in_(["approved", "sent"])).count()
        sent = db.query(OutboxMessage).join(Draft, OutboxMessage.draft_id == Draft.id).filter(Draft.ab_variant == var_id).count()
        
        # Count positive replies for this variant
        replies_count = db.query(Reply).join(Prospect, Reply.prospect_id == Prospect.id).join(Draft, Draft.prospect_id == Prospect.id).filter(
            Draft.ab_variant == var_id,
            Reply.classification == "interested"
        ).count()

        approval_rate = round((approved / total_drafted) * 100, 1) if total_drafted > 0 else 0.0
        conversion_rate = round((replies_count / max(1, sent)) * 100, 1) if sent > 0 else 0.0

        variants_data.append({
            "variant_id": var_id,
            "subject_style": meta["subject_style"],
            "opener_style": meta["opener_style"],
            "subject_prefix": meta["subject_prefix"],
            "drafted_count": total_drafted,
            "approved_count": approved,
            "sent_count": sent,
            "positive_replies": replies_count,
            "approval_rate_pct": approval_rate,
            "conversion_rate_pct": conversion_rate
        })

    # Sector breakdown
    sectors = ["fintech", "health", "edtech", "e-commerce", "SaaS"]
    sector_performance = []
    for sec in sectors:
        sec_drafts = db.query(Draft).join(Prospect).filter(Prospect.sector == sec).count()
        sec_approved = db.query(Draft).join(Prospect).filter(Prospect.sector == sec, Draft.status.in_(["approved", "sent"])).count()
        rate = round((sec_approved / sec_drafts) * 100, 1) if sec_drafts > 0 else 0.0
        sector_performance.append({
            "sector": sec,
            "drafts": sec_drafts,
            "approved": sec_approved,
            "approval_rate_pct": rate
        })

    # Winner calculation
    # Highest conversion rate with at least 1 send, or highest approval rate
    winner = max(variants_data, key=lambda v: (v["conversion_rate_pct"], v["approval_rate_pct"]), default=None)
    winner_id = winner["variant_id"] if winner and (winner["drafted_count"] > 0) else "A_A"

    return {
        "variants": variants_data,
        "winner_variant_id": winner_id,
        "winner_reason": f"Variant {winner_id} leads with {winner.get('approval_rate_pct', 0)}% approval rate and {winner.get('conversion_rate_pct', 0)}% demo conversion.",
        "sector_breakdown": sector_performance
    }
