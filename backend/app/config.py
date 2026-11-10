from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional
import os

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=[".env", "../.env"],
        env_file_encoding="utf-8",
        extra="ignore"
    )

    # Groq API settings
    GROQ_API_KEY: str = Field(default="", description="Groq API key for Groq models")
    GROQ_MODEL: str = Field(default="openai/gpt-oss-20b", description="Primary Groq model for drafting & review")
    GROQ_FALLBACK_MODEL: str = Field(default="llama-3.1-8b-instant", description="Fast/cheap fallback model")

    # Safety and compliance gates
    DRY_RUN: bool = Field(default=True, description="Safe by default; in dry run mode no real emails are dispatched")
    LEGAL_REVIEWED_TEMPLATES: bool = Field(default=False, description="Legal review gate; must be true before DRY_RUN can be disabled")
    
    # Sender identity and details (mandatory DPDP Act notice)
    SENDER_NAME: str = Field(default="Aakash Verma", description="Representative sender name")
    SENDER_COMPANY: str = Field(default="RegulationFlow Technologies Pvt. Ltd.", description="Legal company name")
    SENDER_ROLE: str = Field(default="Solutions Lead - DPDPFlow", description="Sender title")
    SENDER_EMAIL: str = Field(default="aakash@dpdpflow.com", description="Outbound sender email")
    SENDER_ADDRESS: str = Field(default="Level 4, HustleHub Tech Park, HSR Layout Sector 2, Bengaluru, Karnataka 560102, India", description="Physical registered office address")
    SENDING_DOMAIN: str = Field(default="mail.dpdpflow.com", description="Outbound sending domain/subdomain")
    CALENDAR_URL: str = Field(default="https://cal.com/dpdpflow/compliance-audit-demo", description="Demo booking URL")
    
    # Sending caps and pacing
    DAILY_CAP: int = Field(default=30, ge=1, le=50, description="Max sends per day (capped at 50 to maintain pristine domain rep)")
    SEND_SPACING_SECONDS: int = Field(default=45, ge=5, description="Minimum spacing between sends in seconds")
    WARMUP_TIER: int = Field(default=1, description="Current warm-up stage (1=20/day, 2=35/day, 3=50/day)")

    # Data minimisation and retention
    RETENTION_DAYS: int = Field(default=90, description="Days before unengaged prospects must be purged under DPDP Section 8(7)")

    # URLs
    PUBLIC_BASE_URL: str = Field(default="http://localhost:8000", description="Public backend API URL for one-click unsubscribe")
    FRONTEND_BASE_URL: str = Field(default="http://localhost:5173", description="Frontend web application URL")

    # Database
    DATABASE_URL: str = Field(default="sqlite:///./dpdp_outreach.db", description="SQLite database URL")

    # Optional SMTP (only used when DRY_RUN=false)
    SMTP_HOST: Optional[str] = Field(default=None, description="SMTP server host")
    SMTP_PORT: int = Field(default=587, description="SMTP port")
    SMTP_USERNAME: Optional[str] = Field(default=None, description="SMTP login user / Gmail app account")
    SMTP_PASSWORD: Optional[str] = Field(default=None, description="SMTP password / app password")
    SMTP_USE_TLS: bool = Field(default=True, description="Enable TLS")

settings = Settings()
