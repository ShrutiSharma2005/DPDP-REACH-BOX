from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any
from app.db import get_db
from app.models import Prospect, Draft, OutboxMessage, Reply, SuppressionEntry

router = APIRouter(prefix="/api/metrics", tags=["Metrics"])

@router.get("")
def get_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    total_prospects = db.query(Prospect).count()
    verified_prospects = db.query(Prospect).filter(Prospect.email_verified == True).count()
    verified_rate = round((verified_prospects / total_prospects) * 100, 1) if total_prospects > 0 else 0.0

    cleared_prospects = db.query(Prospect).filter(Prospect.status.in_(["cleared", "drafted", "approved", "sent", "replied", "opted_out"])).count()
    total_drafts = db.query(Draft).count()
    approved_drafts = db.query(Draft).filter(Draft.status.in_(["approved", "sent"])).count()
    unedited_approved = db.query(Draft).filter(Draft.status.in_(["approved", "sent"]), Draft.original_email_body.is_(None)).count()
    unedited_pct = round((unedited_approved / approved_drafts) * 100, 1) if approved_drafts > 0 else 0.0

    factual_errors = db.query(Draft).filter(Draft.fact_check_passed == False).count()

    total_sends = db.query(OutboxMessage).filter(OutboxMessage.status.in_(["sent_dry_run", "sent_live"])).count()
    bounced_count = db.query(OutboxMessage).filter(OutboxMessage.status == "failed").count()
    bounce_rate = round((bounced_count / max(1, total_sends + bounced_count)) * 100, 1) if total_sends > 0 else 0.0

    total_replies = db.query(Reply).count()
    reply_rate = round((total_replies / max(1, total_sends)) * 100, 1) if total_sends > 0 else 0.0

    positive_replies = db.query(Reply).filter(Reply.classification == "interested").count()
    opt_out_replies = db.query(Reply).filter(Reply.classification == "opt_out").count()
    opt_out_rate = round((opt_out_replies / max(1, total_sends)) * 100, 1) if total_sends > 0 else 0.0

    # Funnel counts
    funnel = [
        {"stage": "Imported", "count": total_prospects, "color": "#6366f1"},
        {"stage": "Verified", "count": verified_prospects, "color": "#3b82f6"},
        {"stage": "Cleared", "count": cleared_prospects, "color": "#0ea5e9"},
        {"stage": "Drafted", "count": total_drafts, "color": "#8b5cf6"},
        {"stage": "Approved", "count": approved_drafts, "color": "#a855f7"},
        {"stage": "Sent", "count": total_sends, "color": "#10b981"},
        {"stage": "Replied", "count": total_replies, "color": "#f59e0b"},
        {"stage": "Demo Requested", "count": positive_replies, "color": "#ec4899"}
    ]

    # Sector distribution
    sector_counts = db.query(Prospect.sector, func.count(Prospect.id)).group_by(Prospect.sector).all()
    sectors = [{"sector": s, "count": c} for s, c in sector_counts]

    return {
        "kpis": [
            {
                "id": "sends",
                "label": "Total Approved Sends",
                "value": total_sends,
                "target": "400+ sends",
                "met": total_sends >= 400,
                "unit": "sends",
                "description": "Human-reviewed sends dispatched (safe dry-run / live)"
            },
            {
                "id": "verified_rate",
                "label": "Verified Work Email Rate",
                "value": f"{verified_rate}%",
                "target": ">90%",
                "met": verified_rate >= 90.0,
                "unit": "%",
                "description": "Zero personal domains; syntax & MX deliverability validated"
            },
            {
                "id": "bounce_rate",
                "label": "Bounce Rate",
                "value": f"{bounce_rate}%",
                "target": "<2%",
                "met": bounce_rate < 2.0,
                "unit": "%",
                "description": "Low bounce risk preserved via pre-send verification"
            },
            {
                "id": "reply_rate",
                "label": "Reply Rate",
                "value": f"{reply_rate}%",
                "target": "3–5%",
                "met": reply_rate >= 3.0,
                "unit": "%",
                "description": "Decision-maker engagement across target Indian ICP"
            },
            {
                "id": "positive_replies",
                "label": "Demo Requests / Positive",
                "value": positive_replies,
                "target": "10+ demos",
                "met": positive_replies >= 10,
                "unit": "demos",
                "description": "Qualified decision-makers routed to calendar demo link"
            },
            {
                "id": "opt_out_rate",
                "label": "Opt-Out Rate",
                "value": f"{opt_out_rate}%",
                "target": "<1%",
                "met": opt_out_rate < 1.0,
                "unit": "%",
                "description": "Instant suppression and respectful, high-relevance messaging"
            },
            {
                "id": "unedited_approvals",
                "label": "Drafts Approved Unedited",
                "value": f"{unedited_pct}%",
                "target": ">70%",
                "met": unedited_pct >= 70.0,
                "unit": "%",
                "description": "High alignment between RAG generation and human reviewers"
            },
            {
                "id": "factual_errors",
                "label": "Factual / Legal Errors",
                "value": factual_errors,
                "target": "0 errors",
                "met": factual_errors == 0,
                "unit": "errors",
                "description": "Zero hallucinated statutory sections or banned penalty phrasing"
            }
        ],
        "funnel": funnel,
        "sectors": sectors
    }
