"""LLM client resilience, with a fake OpenAI client: retries on temporary errors,
falls back to the second model, raises instead of returning canned data, and skips
the network for a while after a failure (circuit breaker)."""
import pytest

from app.core.config import settings
from app.llm import client as llm


class FakeError(Exception):
    def __init__(self, status_code):
        super().__init__(f"HTTP {status_code}")
        self.status_code = status_code


class FakeOpenAI:
    """Plays back a script of results per model: an exception to raise or text to return."""
    def __init__(self, script):
        self.script = {m: list(v) for m, v in script.items()}
        self.calls = []
        self.chat = self
        self.completions = self

    def create(self, model, messages, temperature):
        self.calls.append(model)
        step = self.script[model].pop(0)
        if isinstance(step, Exception):
            raise step

        class R:
            choices = [type("C", (), {"message": type("M", (), {"content": step})()})()]
        return R()


@pytest.fixture
def make_client(monkeypatch):
    monkeypatch.setattr(llm.time, "sleep", lambda s: None)
    monkeypatch.setattr(settings, "LLM_MAX_RETRIES", 2)
    monkeypatch.setattr(settings, "LLM_CIRCUIT_SECONDS", 60.0)

    def build(script, fallback="backup-model"):
        c = llm.LLMClient()
        c.demo_mode, c.model, c.fallback_model = False, "main-model", fallback
        c._openai_client = FakeOpenAI(script)
        return c
    return build


def ask(c):
    return c.generate_completion(system_prompt="s", user_prompt="u")


def test_temporary_server_errors_are_retried(make_client):
    c = make_client({"main-model": [FakeError(502), FakeError(503), '{"ok": true}']})
    assert ask(c) == '{"ok": true}'
    assert c._openai_client.calls == ["main-model"] * 3


def test_permanent_error_moves_to_the_fallback_model(make_client):
    c = make_client({"main-model": [FakeError(404)], "backup-model": ["fine"]})
    assert ask(c) == "fine"
    assert c._openai_client.calls == ["main-model", "backup-model"]


def test_total_failure_raises_and_never_switches_to_demo_data(make_client):
    c = make_client({"main-model": [FakeError(500)] * 3, "backup-model": [FakeError(500)] * 3})
    with pytest.raises(llm.LLMUnavailableError):
        ask(c)
    assert c.demo_mode is False
    assert c.status()["state"] == "degraded" and c.failures == 1


def test_circuit_breaker_skips_the_network_after_a_failure(make_client):
    c = make_client({"main-model": [FakeError(401)], "backup-model": [FakeError(401)]})
    with pytest.raises(llm.LLMUnavailableError):
        ask(c)
    calls = len(c._openai_client.calls)
    with pytest.raises(llm.LLMUnavailableError, match="skipped"):
        ask(c)
    assert len(c._openai_client.calls) == calls


def test_circuit_closes_again_after_the_wait(make_client):
    c = make_client({"main-model": [FakeError(401), "back"], "backup-model": [FakeError(401)]})
    with pytest.raises(llm.LLMUnavailableError):
        ask(c)
    c._down_until = 0.0  # the 60 s have passed
    assert ask(c) == "back" and c.status()["state"] == "live"


def test_demo_mode_by_configuration_still_returns_canned_output():
    c = llm.LLMClient()
    c.demo_mode = True
    assert "line_items" in c.generate_completion(system_prompt="s", user_prompt="extract requirements")


def test_rate_limit_switches_to_the_fallback_model_without_waiting(make_client, monkeypatch):
    waits = []
    monkeypatch.setattr(llm.time, "sleep", waits.append)
    c = make_client({"main-model": [FakeError(429)], "backup-model": ["from backup"]})
    assert ask(c) == "from backup"
    assert c._openai_client.calls == ["main-model", "backup-model"] and waits == []


def test_rate_limit_on_the_last_model_is_waited_out(make_client):
    c = make_client({"main-model": [FakeError(429), "ok"]}, fallback="")
    assert ask(c) == "ok"


def test_health_reports_llm_state_without_the_raw_error(monkeypatch):
    from fastapi.testclient import TestClient
    from app.main import app
    monkeypatch.setattr(llm.llm_client, "last_error", "groq: 429 org_secret123")
    body = TestClient(app).get("/api/health").json()
    assert body["llm"]["state"] in {"live", "degraded", "demo"}
    assert "last_error" not in body["llm"] and "org_secret123" not in str(body)
