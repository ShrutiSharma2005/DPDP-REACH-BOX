import pytest
from app.agents.reply_tracker import classify_reply_text

HARD_OPT_OUT_CASES = [
    "stop",
    "unsubscribe",
    "remove me",
    "don't contact",
    "do not contact me again",
    "not interested, please delete my data",
    "take me off",
    "no more emails",
    "GDPR/DPDP erasure requested",
    "cease all communications immediately",
    "kindly remove our company from your lists",
    "lose my number and do not reach out",
    "please do not email me again",
    "opt-out of all messages"
]

@pytest.mark.parametrize("phrasing", HARD_OPT_OUT_CASES)
def test_hard_opt_out_detection(phrasing):
    classification, confidence, reason, source = classify_reply_text(phrasing)
    assert classification == "opt_out", f"Failed to classify '{phrasing}' as opt_out"
    assert confidence >= 0.9
