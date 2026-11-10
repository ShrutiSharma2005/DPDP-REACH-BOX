from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProspectBase(BaseModel):
    name: str
    role: str
    company: str
    work_email: str
    country: str = "India"
    employee_count: int = 100
    sector: str
    source: str
    lawful_basis: str
    recent_trigger: Optional[str] = None

class ProspectCreate(ProspectBase):
    pass

class ProspectResponse(ProspectBase):
    id: int
    email_verified: bool
    email_verification_status: str
    status: str
    unsubscribe_token: str
    created_at: datetime
    updated_at: datetime
    last_engaged_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ImportReportResponse(BaseModel):
    total_rows: int
    imported_count: int
    rejected_count: int
    rejected_details: List[Dict[str, Any]]

class DraftResponse(BaseModel):
    id: int
    prospect_id: int
    persona: str
    subject: str
    email_body: str
    linkedin_note: str
    ab_variant: str
    citations: List[Dict[str, Any]]
    fact_check_passed: bool
    fact_check_reasons: List[str]
    word_count: int
    linkedin_char_count: int
    status: str
    reviewer_notes: Optional[str] = None
    created_at: datetime
    reviewed_at: Optional[datetime] = None
    prospect: Optional[ProspectResponse] = None

    class Config:
        from_attributes = True

class DraftUpdateRequest(BaseModel):
    subject: Optional[str] = None
    email_body: Optional[str] = None
    linkedin_note: Optional[str] = None
    status: Optional[str] = None # approved, rejected, edited
    reviewer_notes: Optional[str] = None

class BulkApproveRequest(BaseModel):
    draft_ids: List[int]

class OutboxResponse(BaseModel):
    id: int
    draft_id: Optional[int]
    prospect_id: int
    recipient_email: str
    subject: str
    email_body: str
    scheduled_for: datetime
    sent_at: Optional[datetime]
    status: str
    error_message: Optional[str]
    is_dry_run: bool

    class Config:
        from_attributes = True

class ReplyCreate(BaseModel):
    from_email: str
    subject: Optional[str] = "Re: DPDP Act 2023 Compliance"
    body: str

class ReplyResponse(BaseModel):
    id: int
    prospect_id: Optional[int]
    from_email: str
    subject: Optional[str]
    body: str
    classification: str
    confidence: float
    classification_reason: Optional[str]
    classifier_source: str
    created_at: datetime

    class Config:
        from_attributes = True

class SuppressionCreate(BaseModel):
    email: str
    reason: str = "manual_admin"
    source_note: Optional[str] = None

class SuppressionResponse(BaseModel):
    id: int
    email: str
    reason: str
    source_note: Optional[str]
    suppressed_at: datetime

    class Config:
        from_attributes = True

class AuditLogResponse(BaseModel):
    id: int
    timestamp: datetime
    event_type: str
    actor: str
    entity_id: Optional[str]
    details: Optional[str]

    class Config:
        from_attributes = True

class SettingsResponse(BaseModel):
    GROQ_API_KEY_CONFIGURED: bool
    GROQ_MODEL: str
    GROQ_FALLBACK_MODEL: str
    DRY_RUN: bool
    LEGAL_REVIEWED_TEMPLATES: bool
    DAILY_CAP: int
    SEND_SPACING_SECONDS: int
    WARMUP_TIER: int
    SENDER_NAME: str
    SENDER_COMPANY: str
    SENDER_ROLE: str
    SENDER_EMAIL: str
    SENDER_ADDRESS: str
    SENDING_DOMAIN: str
    CALENDAR_URL: str
    RETENTION_DAYS: int
    PUBLIC_BASE_URL: str

class SettingsUpdateRequest(BaseModel):
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: Optional[str] = None
    GROQ_FALLBACK_MODEL: Optional[str] = None
    DRY_RUN: Optional[bool] = None
    LEGAL_REVIEWED_TEMPLATES: Optional[bool] = None
    DAILY_CAP: Optional[int] = None
    SEND_SPACING_SECONDS: Optional[int] = None
    SENDER_NAME: Optional[str] = None
    SENDER_COMPANY: Optional[str] = None
    SENDER_ROLE: Optional[str] = None
    SENDER_EMAIL: Optional[str] = None
    SENDER_ADDRESS: Optional[str] = None
    SENDING_DOMAIN: Optional[str] = None
    CALENDAR_URL: Optional[str] = None
    RETENTION_DAYS: Optional[int] = None
