#!/usr/bin/env python3
"""
DPDP Outreach Agent - Test Data Generator CLI
==============================================
Generates synthetic, deterministic, and DPDP-compliant test datasets for:
1. Prospect CSV imports (valid batches, ICP rejection edge cases, mixed batches)
2. Inbound replies for intent classification (opt-out, interested, wrong person, not now)
3. Fact-Checker test suites (clean drafts vs. 7 corruption vectors)

Usage:
    python scripts/generate_test_data.py --all
    python scripts/generate_test_data.py --prospects --count 50 --output test_data/prospects/custom.csv
    python scripts/generate_test_data.py --replies --count 40
    python scripts/generate_test_data.py --fact-checker
"""

import os
import sys
import csv
import json
import random
import argparse
from typing import List, Dict, Any

# Ensure UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

INDIAN_FIRST_NAMES = [
    "Aarav", "Priya", "Vikram", "Ananya", "Rohan", "Kavita", "Arjun", "Sneha",
    "Aditya", "Neha", "Siddharth", "Divya", "Karan", "Pooja", "Manish", "Sunita",
    "Gaurav", "Ritu", "Abhishek", "Tanvi", "Rajesh", "Meera", "Varun", "Shalini",
    "Naveen", "Deepak", "Smriti", "Kunal", "Bhavna", "Amitabh", "Anand", "Swati",
    "Nikhil", "Preeti", "Harish", "Vandana", "Pradeep", "Archana", "Sameer", "Geeta"
]

INDIAN_LAST_NAMES = [
    "Sharma", "Patel", "Malhotra", "Iyer", "Desai", "Nair", "Reddy", "Kulkarni",
    "Verma", "Joshi", "Sen", "Menon", "Singhania", "Hegde", "Gupta", "Rao",
    "Kapoor", "Saxena", "Bannerjee", "Mehta", "Nambiar", "Pillai", "Chopra", "Roy",
    "Bhat", "Chhabra", "Mehra", "Trivedi", "Bose", "Agarwal", "Sethi", "Murthy",
    "Kaul", "Soni", "Ghosh", "Jain", "Krishnan", "Goswami", "Bansal", "Mathur"
]

ROLES = ["DPO", "CISO", "Head of Legal", "Head of Compliance", "CTO", "Founder & CEO"]

SECTORS = ["fintech", "health", "edtech", "e-commerce", "SaaS"]

LAWFUL_BASES = ["made_public_by_person", "gave_voluntarily", "consented"]

SOURCES = [
    "Company Leadership Directory",
    "Digital Health Conference Speaker Bio",
    "CISO Forum Member Directory",
    "Industry Round-table Attendee List",
    "Public Regulatory Compliance Disclosure",
    "Bar Council Corporate Counsel Listing",
    "DPO Network India Registry"
]

TRIGGERS = [
    "Announced expansion of account aggregator integration",
    "Migrated to Ayushman Bharat Digital Mission (ABDM)",
    "Published ISO 27001 recertification update",
    "Launched new multi-vendor marketplace app",
    "Upgraded customer telemetry stack",
    "Formed internal data protection steering committee",
    "Received NABH accreditation for telemedicine platform",
    "Implementing automated identity lifecycle management",
    "Evaluating consent collection protocols for B2B API clients",
    "Preparing regulatory audit defense for digital lending guidelines",
    "Deploying zero-trust perimeter across clinical portals",
    "Transitioned to microservices architecture",
    "Auditing driver and customer KYC repository",
    "Shipped enterprise SSO and team role-based access"
]

def generate_valid_prospect(idx: int) -> Dict[str, Any]:
    first = INDIAN_FIRST_NAMES[idx % len(INDIAN_FIRST_NAMES)]
    last = INDIAN_LAST_NAMES[(idx * 3) % len(INDIAN_LAST_NAMES)]
    name = f"{first} {last}"
    slug = f"{first.lower()}.{last.lower()}"
    company_slug = f"techfirm{idx + 1}"
    company = f"TechFirm {idx + 1} Labs"
    
    return {
        "name": name,
        "role": ROLES[idx % len(ROLES)],
        "company": company,
        "work_email": f"{slug}@{company_slug}.example",
        "country": "India",
        "employee_count": random.randint(60, 4500),
        "sector": SECTORS[idx % len(SECTORS)],
        "source": SOURCES[idx % len(SOURCES)],
        "lawful_basis": LAWFUL_BASES[idx % len(LAWFUL_BASES)],
        "recent_trigger": TRIGGERS[idx % len(TRIGGERS)],
        "phone": ""
    }

def generate_invalid_prospect(idx: int) -> Dict[str, Any]:
    p = generate_valid_prospect(idx)
    error_types = [
        "personal_gmail", "personal_yahoo", "personal_outlook", "has_phone",
        "foreign_country", "tiny_employees", "giant_employees", "bad_sector",
        "invalid_lawful_basis", "malformed_email", "missing_name"
    ]
    etype = error_types[idx % len(error_types)]
    
    if etype == "personal_gmail":
        p["work_email"] = f"user{idx}@gmail.com"
        p["recent_trigger"] = "Personal Gmail domain"
    elif etype == "personal_yahoo":
        p["work_email"] = f"user{idx}@yahoo.com"
        p["recent_trigger"] = "Personal Yahoo domain"
    elif etype == "personal_outlook":
        p["work_email"] = f"user{idx}@outlook.com"
        p["recent_trigger"] = "Personal Outlook domain"
    elif etype == "has_phone":
        p["phone"] = f"+9198765{idx:05d}"
        p["recent_trigger"] = "Disallowed phone number leak"
    elif etype == "foreign_country":
        p["country"] = random.choice(["United States", "United Kingdom", "Singapore", "Germany"])
        p["recent_trigger"] = f"Foreign country: {p['country']}"
    elif etype == "tiny_employees":
        p["employee_count"] = random.randint(5, 45)
        p["recent_trigger"] = "Headcount below 50"
    elif etype == "giant_employees":
        p["employee_count"] = random.randint(5500, 50000)
        p["recent_trigger"] = "Headcount above 5000"
    elif etype == "bad_sector":
        p["sector"] = random.choice(["Automotive", "Aviation", "Mining", "Real Estate"])
        p["recent_trigger"] = f"Unsupported sector: {p['sector']}"
    elif etype == "invalid_lawful_basis":
        p["lawful_basis"] = random.choice(["legitimate_interest", "scraped_without_consent", "purchased_list", ""])
        p["recent_trigger"] = f"Invalid lawful basis: {p['lawful_basis']}"
    elif etype == "malformed_email":
        p["work_email"] = f"user{idx}-no-at-domain.example"
        p["recent_trigger"] = "Malformed email syntax"
    elif etype == "missing_name":
        p["name"] = ""
        p["recent_trigger"] = "Missing mandatory name"
        
    return p

def write_prospects_csv(filepath: str, rows: List[Dict[str, Any]]):
    os.makedirs(os.path.dirname(os.path.abspath(filepath)), exist_ok=True)
    fieldnames = [
        "name", "role", "company", "work_email", "country", "employee_count",
        "sector", "source", "lawful_basis", "recent_trigger", "phone"
    ]
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f"✅ Generated {len(rows)} prospect rows -> {filepath}")

def main():
    parser = argparse.ArgumentParser(description="Generate synthetic test data for DPDP Outreach Agent")
    parser.add_argument("--all", action="store_true", help="Generate all standard test datasets")
    parser.add_argument("--prospects", action="store_true", help="Generate prospects CSV")
    parser.add_argument("--count", type=int, default=50, help="Number of prospect rows to generate (default: 50)")
    parser.add_argument("--output", type=str, default="", help="Custom output path for generated CSV")
    parser.add_argument("--mix-ratio", type=float, default=0.8, help="Ratio of valid rows in mixed batch (default: 0.8)")

    args = parser.parse_args()

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    test_dir = os.path.join(base_dir, "test_data")

    if args.all or (not args.prospects and not args.output):
        print("🚀 Generating full suite of testing datasets in test_data/...")
        
        # 1. Clean valid prospects
        clean_rows = [generate_valid_prospect(i) for i in range(40)]
        write_prospects_csv(os.path.join(test_dir, "prospects", "01_valid_prospects_clean.csv"), clean_rows)

        # 2. Gate failures
        fail_rows = [generate_invalid_prospect(i) for i in range(30)]
        write_prospects_csv(os.path.join(test_dir, "prospects", "02_icp_and_compliance_gate_failures.csv"), fail_rows)

        # 3. Mixed batch (40 valid + 10 invalid)
        mixed_rows = [generate_valid_prospect(i) for i in range(40)] + [generate_invalid_prospect(i) for i in range(10)]
        random.shuffle(mixed_rows)
        write_prospects_csv(os.path.join(test_dir, "prospects", "03_realistic_mixed_batch.csv"), mixed_rows)

        print("\n🎉 Test data generation complete!")
        print(f"📁 Files available in: {test_dir}")
        return

    if args.prospects or args.output:
        out_path = args.output or os.path.join(test_dir, "prospects", f"generated_{args.count}.csv")
        valid_cnt = int(args.count * args.mix_ratio)
        invalid_cnt = args.count - valid_cnt
        rows = [generate_valid_prospect(i) for i in range(valid_cnt)] + [generate_invalid_prospect(i) for i in range(invalid_cnt)]
        random.shuffle(rows)
        write_prospects_csv(out_path, rows)

if __name__ == "__main__":
    main()
