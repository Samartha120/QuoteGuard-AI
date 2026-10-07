"""Test-wide setup. Runs before any test module imports the app.

Forces demo mode so the suite never calls a real LLM provider, even when
backend/.env holds a live API key: tests that need an LLM use fakes."""
import os

os.environ["DEMO_MODE"] = "true"


import pytest


@pytest.fixture(autouse=True)
def no_customer_memory(monkeypatch):
    """Keep tests independent of whatever is in the local database: the Validation &
    Planning agent sees a new customer unless a test supplies a history."""
    monkeypatch.setattr("app.agents.validation_planning_agent.lookup_customer_history",
                        lambda name, exclude_rfq_id=None: {"found": False})
