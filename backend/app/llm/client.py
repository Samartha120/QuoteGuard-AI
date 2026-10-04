import os
import json
import time
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.llm.structured_output import clean_and_parse_json

# HTTP statuses worth retrying: timeout, conflict, rate limit, provider-side errors
TRANSIENT_STATUS = {408, 409, 429, 500, 502, 503, 504}
MAX_BACKOFF_S = 5.0


class LLMUnavailableError(RuntimeError):
    """Raised when no configured model answered. Callers degrade (rules only, retry,
    escalate) instead of receiving made-up output."""


def _is_transient(e: Exception) -> bool:
    status = getattr(e, "status_code", None)
    return status in TRANSIENT_STATUS or isinstance(e, TimeoutError) or \
        type(e).__name__ in {"APITimeoutError", "APIConnectionError"}


def _retry_after(e: Exception, attempt: int) -> float:
    """Seconds to wait: the provider's Retry-After header when given, else exponential backoff."""
    try:
        header = e.response.headers.get("retry-after")  # type: ignore[attr-defined]
        if header:
            return min(float(header), MAX_BACKOFF_S)
    except Exception:
        pass
    return min(0.5 * (2 ** attempt), MAX_BACKOFF_S)


class LLMClient:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self.fallback_model = settings.OPENAI_FALLBACK_MODEL
        self.base_url = settings.OPENAI_BASE_URL
        # Demo mode is decided once, from configuration. A failed call never switches it
        # on: canned answers written for the two sample RFQs must not reach a real RFQ.
        self.demo_mode = settings.DEMO_MODE or not bool(self.api_key and self.api_key != "your-openai-api-key-here")
        self._openai_client = None
        self._down_until = 0.0      # circuit breaker: skip the network until this time
        self.last_error: Optional[str] = None
        self.failures = 0

    def _get_client(self):
        if self._openai_client is None:
            from openai import OpenAI
            self._openai_client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
                timeout=settings.LLM_TIMEOUT_SECONDS,
                max_retries=0,  # retries are handled below, across models
            )
        return self._openai_client

    def status(self) -> Dict[str, Any]:
        """For health checks: is the LLM live, in demo mode, or currently skipped after failures?"""
        if self.demo_mode:
            state = "demo"
        elif time.time() < self._down_until:
            state = "degraded"
        else:
            state = "live"
        return {"state": state, "model": None if self.demo_mode else self.model,
                "fallback_model": self.fallback_model or None, "failures": self.failures,
                "last_error": self.last_error}

    def generate_completion(self, system_prompt: str, user_prompt: str) -> str:
        """Calls the configured OpenAI-compatible model.

        Temporary errors are retried with backoff; if the primary model still fails the
        fallback model is tried; if nothing answers, LLMUnavailableError is raised and the
        circuit breaker skips the network for LLM_CIRCUIT_SECONDS. In demo mode (by
        configuration only) a canned answer is returned."""
        if self.demo_mode:
            return self._generate_demo_completion(user_prompt)

        if time.time() < self._down_until:
            raise LLMUnavailableError(f"LLM skipped after recent failures: {self.last_error}")

        messages = [{"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}]
        models = [m for m in (self.model, self.fallback_model) if m]
        for i, model in enumerate(models):
            has_next = i + 1 < len(models)
            for attempt in range(settings.LLM_MAX_RETRIES + 1):
                try:
                    response = self._get_client().chat.completions.create(
                        model=model, messages=messages, temperature=0.0)
                    self._down_until = 0.0
                    return response.choices[0].message.content or ""
                except Exception as e:
                    self.last_error = f"{model}: {type(e).__name__}: {str(e)[:200]}"
                    if getattr(e, "status_code", None) == 429 and has_next:
                        # rate limits are per model: the next model answers now instead of
                        # waiting out this one's quota
                        logger.warning(f"{model} rate-limited; switching to {models[i + 1]}")
                        break
                    if _is_transient(e) and attempt < settings.LLM_MAX_RETRIES:
                        wait = _retry_after(e, attempt)
                        logger.warning(f"LLM call failed ({self.last_error}); retrying in {wait:.1f}s")
                        time.sleep(wait)
                        continue
                    logger.error(f"LLM call failed ({self.last_error}); giving up on {model}")
                    break

        self.failures += 1
        self._down_until = time.time() + settings.LLM_CIRCUIT_SECONDS
        raise LLMUnavailableError(f"no model answered: {self.last_error}")

    def _generate_demo_completion(self, user_prompt: str) -> str:
        """Deterministic demo output for zero-cost offline viva demonstration."""
        prompt_lower = user_prompt.lower()
        
        # RFQ 1 Complete standard case
        if "apex engineering" in prompt_lower or ("iv-200" in prompt_lower and "ss304" in prompt_lower):
            if "extract" in prompt_lower:
                return json.dumps({
                    "customer_name": "Apex Engineering Works Ltd.",
                    "customer_email": "procurement@apexeng.co.in",
                    "line_items": [
                        {
                            "product_name": "Industrial Valve IV-200",
                            "product_code": "IV-200",
                            "requested_spec": "Standard SS304 body with PTFE seals, PN16 rating",
                            "material_grade": "SS304",
                            "quantity": 20
                        },
                        {
                            "product_name": "Pressure Relief Valve PV-100",
                            "product_code": "PV-100",
                            "requested_spec": "Standard SS304 seat",
                            "material_grade": "SS304",
                            "quantity": 15
                        }
                    ],
                    "payment_terms": "Net 30 days credit",
                    "delivery_terms": "Ex-works Pune"
                })

        # RFQ 2 Ambiguous / SS316 case
        if "zenith chemical" in prompt_lower or "ss316" in prompt_lower:
            if "extract" in prompt_lower:
                return json.dumps({
                    "customer_name": "Zenith Chemical Processing Ltd.",
                    "customer_email": "a.sharma@zenithchem.com",
                    "line_items": [
                        {
                            "product_name": "Industrial Valve IV-200",
                            "product_code": "IV-200",
                            "requested_spec": "Heavy Duty SS316 High-Corrosion Grade Variant",
                            "material_grade": "SS316",
                            "quantity": 50
                        }
                    ],
                    "payment_terms": "90 Days post-installation credit",
                    "delivery_terms": "Doorstep delivery within 3 days to Surat"
                })

        # Default fallback extraction
        return json.dumps({
            "customer_name": "Sample B2B Industrial Client",
            "customer_email": "purchasing@client.com",
            "line_items": [
                {
                    "product_name": "Industrial Valve IV-200",
                    "product_code": "IV-200",
                    "requested_spec": "Standard stock specification",
                    "material_grade": "SS304",
                    "quantity": 10
                }
            ],
            "payment_terms": "Net 30 Days",
            "delivery_terms": "Ex-works"
        })

llm_client = LLMClient()
