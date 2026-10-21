"""The approve / reject / request-changes body the frontend sends ({notes} only) must be accepted."""
from app.schemas.quotation import ApprovalActionRequest


def test_frontend_body_with_only_notes_is_valid():
    assert ApprovalActionRequest(**{"notes": None}).notes is None
    assert ApprovalActionRequest(**{"notes": "please recheck pricing"}).notes == "please recheck pricing"


def test_empty_body_is_valid():
    assert ApprovalActionRequest(**{}).action is None
