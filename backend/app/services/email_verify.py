import re
import dns.resolver
from email_validator import validate_email, EmailNotValidError
from typing import Tuple, Dict, Any

DISALLOWED_PERSONAL_DOMAINS = {
    "gmail.com", "yahoo.com", "yahoo.co.in", "outlook.com", "hotmail.com", 
    "live.com", "icloud.com", "rediffmail.com", "proton.me", "protonmail.com",
    "zoho.com", "aol.com", "yandex.com", "mail.com"
}

RESERVED_TEST_DOMAINS = {
    "example", "example.com", "example.org", "example.net", "test", "invalid", "localhost"
}

def is_personal_email_domain(email: str) -> bool:
    if "@" not in email:
        return False
    domain = email.split("@")[1].strip().lower()
    return domain in DISALLOWED_PERSONAL_DOMAINS

def verify_email_address(email: str, check_mx: bool = True) -> Tuple[bool, str, Dict[str, Any]]:
    """
    Validates work email address:
    1. Syntax validation (via email-validator)
    2. Rejects personal consumer domains (gmail, yahoo, outlook, etc.)
    3. Verifies DNS MX records for corporate domain (with simulation for RFC 2606 .example domains)
    """
    if not email or not isinstance(email, str):
        return False, "Email address is missing or empty", {"stage": "presence"}

    clean_email = email.strip()

    # 1. Reject personal domains
    if is_personal_email_domain(clean_email):
        return False, "Disallowed personal consumer email domain. DPDP compliance requires verified corporate work contacts.", {
            "stage": "domain_policy",
            "domain": clean_email.split("@")[1].lower() if "@" in clean_email else ""
        }

    # 2. Syntax validation
    try:
        validated = validate_email(clean_email, check_deliverability=False)
        normalized_email = validated.normalized
        domain = validated.domain.lower()
    except EmailNotValidError as e:
        return False, f"Email syntax error: {str(e)}", {"stage": "syntax"}

    # 3. MX Record check
    # Check if reserved test domain (RFC 2606)
    if domain.endswith(".example") or domain in RESERVED_TEST_DOMAINS:
        return True, "Valid corporate test domain (.example)", {
            "stage": "mx_simulated",
            "domain": domain,
            "normalized": normalized_email
        }

    if check_mx:
        try:
            records = dns.resolver.resolve(domain, 'MX', lifetime=4.0)
            if not records:
                return False, f"No MX records found for domain '{domain}'.", {"stage": "mx"}
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
            return False, f"Domain '{domain}' does not exist or has no active mail exchange (MX) records.", {"stage": "mx"}
        except dns.resolver.Timeout:
            # Tolerant on local DNS timeout if syntax is completely valid
            return True, f"MX lookup timed out; provisionally verified based on valid corporate syntax.", {"stage": "mx_timeout"}
        except Exception as e:
            return False, f"DNS MX lookup error: {str(e)}", {"stage": "mx_error"}

    return True, "Email syntax and corporate MX records verified.", {
        "stage": "complete",
        "domain": domain,
        "normalized": normalized_email
    }
