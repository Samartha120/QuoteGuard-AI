import os
import json
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.core.logging import logger
from app.llm.structured_output import clean_and_parse_json

class LLMClient:
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        self.base_url = settings.OPENAI_BASE_URL
        self.demo_mode = settings.DEMO_MODE or not bool(self.api_key and self.api_key != "your-openai-api-key-here")
        self._openai_client = None

    def _get_client(self):
        if self._openai_client is None and not self.demo_mode:
            try:
                from openai import OpenAI
                self._openai_client = OpenAI(
                    api_key=self.api_key,
                    base_url=self.base_url
                )
            except Exception as e:
                logger.warning(f"Could not initialize OpenAI client ({e}). Enabling Demo Mode.")
                self.demo_mode = True
        return self._openai_client

    def generate_completion(self, system_prompt: str, user_prompt: str) -> str:
        """Invokes OpenAI-compatible API or demo fallback."""
        if not self.demo_mode:
            client = self._get_client()
            if client:
                try:
                    response = client.chat.completions.create(
                        model=self.model,
                        messages=[
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": user_prompt}
                        ],
                        temperature=0.0
                    )
                    return response.choices[0].message.content or ""
                except Exception as e:
                    logger.error(f"LLM API Call Error: {e}. Falling back to Demo Mode engine.")
                    self.demo_mode = True

        # Deterministic Demo Mode fallback handler
        return self._generate_demo_completion(user_prompt)

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
