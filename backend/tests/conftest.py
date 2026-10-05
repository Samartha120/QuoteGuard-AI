"""Test-wide setup. Runs before any test module imports the app.

Forces demo mode so the suite never calls a real LLM provider, even when
backend/.env holds a live API key: tests that need an LLM use fakes."""
import os

os.environ["DEMO_MODE"] = "true"
