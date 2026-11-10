import uuid
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.db import Base

class Prospect(Base):
    __tablename__ = "prospects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    role = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    work_email = Column(String(255), unique=True, index=True, nullable=False)
    country = Column(String(100), default="India", nullable=False)
    employee_count = Column(Integer, nullable=False, default=100)
    sector = Column(String(100), nullable=False)
    source = Column(String(255), nullable=False)
    lawful_basis = Column(String(100), nullable=False) # made_public_by_person, gave_voluntarily, consented
    recent_trigger = Column(Text, nullable=True)
    
    # Enrichment & Verification
    email_verified = Column(Boolean, default=False)
    email_verification_status = Column(String(50), default="pending") # valid, syntax_error, mx_missing, disposable_rejected
    
    # Pipeline status: imported, verified, cleared, drafted, approved, sent, replied, opted_out, bounced
    status = Column(String(50), default="imported", index=True)
    unsubscribe_token = Column(String(64), unique=True, index=True, default=lambda: uuid.uuid4().hex)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_engaged_at = Column(DateTime, nullable=True)

    # Relationships
    drafts = relationship("Draft", back_populates="prospect", cascade="all, delete-orphan")
    outbox_messages = relationship("OutboxMessage", back_populates="prospect", cascade="all, delete-orphan")
    replies = relationship("Reply", back_populates="prospect", cascade="all, delete-orphan")


class Draft(Base):
    __tablename__ = "drafts"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id", ondelete="CASCADE"), nullable=False)
    persona = Column(String(100), nullable=False) # DPO/Compliance, CISO/CTO, Founder, Head of Legal
    subject = Column(String(255), nullable=False)
    email_body = Column(Text, nullable=False)
    linkedin_note = Column(String(500), nullable=False) # <= 300 chars
    ab_variant = Column(String(50), default="A_A") # e.g. "A_A", "B_B"
    citations = Column(Text, default="[]") # JSON array of citations
    
    # Fact checker results
    fact_check_passed = Column(Boolean, default=False)
    fact_check_reasons = Column(Text, default="[]") # JSON list of checks & failures
    word_count = Column(Integer, default=0)
    linkedin_char_count = Column(Integer, default=0)

    # Review status: drafted, approved, edited, rejected
    status = Column(String(50), default="drafted", index=True)
    reviewer_notes = Column(Text, nullable=True)
    original_email_body = Column(Text, nullable=True) # to track reviewer edits for few-shot learning
    
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    prospect = relationship("Prospect", back_populates="drafts")
    outbox_message = relationship("OutboxMessage", back_populates="draft", uselist=False)


class OutboxMessage(Base):
    __tablename__ = "outbox"

    id = Column(Integer, primary_key=True, index=True)
    draft_id = Column(Integer, ForeignKey("drafts.id", ondelete="SET NULL"), nullable=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id", ondelete="CASCADE"), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=False)
    email_body = Column(Text, nullable=False)
    scheduled_for = Column(DateTime, default=datetime.utcnow)
    sent_at = Column(DateTime, nullable=True)
    status = Column(String(50), default="queued", index=True) # queued, sent_dry_run, sent_live, failed, blocked_suppressed
    error_message = Column(Text, nullable=True)
    is_dry_run = Column(Boolean, default=True)

    prospect = relationship("Prospect", back_populates="outbox_messages")
    draft = relationship("Draft", back_populates="outbox_message")


class Reply(Base):
    __tablename__ = "replies"

    id = Column(Integer, primary_key=True, index=True)
    prospect_id = Column(Integer, ForeignKey("prospects.id", ondelete="SET NULL"), nullable=True)
    from_email = Column(String(255), nullable=False)
    subject = Column(String(255), nullable=True)
    body = Column(Text, nullable=False)
    classification = Column(String(50), nullable=False) # interested, not_now, wrong_person, opt_out
    confidence = Column(Float, default=1.0)
    classification_reason = Column(Text, nullable=True)
    classifier_source = Column(String(50), default="keyword_first") # keyword_rule or groq_llm
    created_at = Column(DateTime, default=datetime.utcnow)

    prospect = relationship("Prospect", back_populates="replies")


class SuppressionEntry(Base):
    __tablename__ = "suppression_list"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    reason = Column(String(100), nullable=False) # one_click_unsubscribe, reply_opt_out, manual_admin, bounce
    source_note = Column(Text, nullable=True)
    suppressed_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_type = Column(String(100), nullable=False)
    actor = Column(String(100), default="system")
    entity_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=False)
