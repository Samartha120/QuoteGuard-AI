import json
import pytest
from app.agents.requirement_agent import run_requirement_agent, _backfill_product_codes
from app.agents.requirement_flags import (
    extract_requirement_flags,
    check_quantity_range,
    check_missing_grade,
    check_vague_spec,
)
from app.agents.state import AgentState
from app.llm.client import llm_client


def test_flags_quantity_range_detection():
    """Verify detection of range or fuzzy quantity representations."""
    # Direct range string in quantity
    item1 = {"product_name": "Industrial Valve", "quantity": "around 30 to 40"}
    flag1 = check_quantity_range(item1)
    assert flag1 is not None
    assert flag1["type"] == "quantity_range"

    # Hyphenated range
    item2 = {"product_name": "Pressure Relief Valve", "quantity": "15-20"}
    flag2 = check_quantity_range(item2)
    assert flag2 is not None
    assert flag2["type"] == "quantity_range"

    # Exact integer quantity has no range flag
    item3 = {"product_name": "Industrial Valve", "quantity": 25}
    assert check_quantity_range(item3) is None


def test_flags_quantity_range_from_raw_text():
    """Verify detection of quantity estimate from raw RFQ text window."""
    raw = "Dear Sales, we need around 30 to 40 units of Industrial Valve for our plant."
    item = {"product_name": "Industrial Valve", "quantity": 30}
    flag = check_quantity_range(item, raw_text=raw)
    assert flag is not None
    assert flag["type"] == "quantity_range"


def test_flags_missing_grade():
    """Verify detection of missing or unspecified material grade."""
    item_missing = {"product_name": "Industrial Valve", "material_grade": None}
    flag = check_missing_grade(item_missing)
    assert flag is not None
    assert flag["type"] == "missing_grade"

    item_unspecified = {"product_name": "Industrial Valve", "material_grade": "unspecified"}
    flag2 = check_missing_grade(item_unspecified)
    assert flag2 is not None
    assert flag2["type"] == "missing_grade"

    item_valid = {"product_name": "Industrial Valve", "material_grade": "SS304"}
    assert check_missing_grade(item_valid) is None


def test_flags_vague_spec():
    """Verify detection of empty, placeholder, or vague technical specifications."""
    item_vague = {"product_name": "Industrial Valve", "requested_spec": "standard"}
    flag = check_vague_spec(item_vague)
    assert flag is not None
    assert flag["type"] == "vague_spec"

    item_empty = {"product_name": "Industrial Valve", "requested_spec": ""}
    flag2 = check_vague_spec(item_empty)
    assert flag2 is not None
    assert flag2["type"] == "vague_spec"

    item_good = {
        "product_name": "Industrial Valve",
        "requested_spec": "2-inch DN50 PN16 rating with PTFE seals",
    }
    assert check_vague_spec(item_good) is None


def test_extract_requirement_flags_aggregate():
    """Verify aggregation of multiple requirement flags across items."""
    line_items = [
        {
            "product_name": "Industrial Valve",
            "quantity": "around 20",
            "material_grade": None,
            "requested_spec": "standard",
        },
        {
            "product_name": "Pressure Relief Valve",
            "product_code": "PV-100",
            "quantity": 10,
            "material_grade": "SS304",
            "requested_spec": "Standard SS304 seat with calibrated spring",
        },
    ]

    flags = extract_requirement_flags(line_items)
    flag_types = [f["type"] for f in flags]

    assert "quantity_range" in flag_types
    assert "missing_grade" in flag_types
    assert "vague_spec" in flag_types


def test_backfill_product_codes_resolves_catalogue():
    """Verify product_code is resolved from catalogue name when omitted by the LLM."""
    items = [
        {"product_name": "Industrial Valve", "product_code": ""},
        {"product_name": "Pressure Relief Valve", "product_code": None},
    ]

    corrected = _backfill_product_codes(items)
    assert corrected >= 1
    assert items[0]["product_code"] == "IV-200"
    assert items[1]["product_code"] == "PV-100"


def test_run_requirement_agent_end_to_end(monkeypatch):
    """Verify full execution of Requirement Analysis Agent with mock LLM output."""
    mock_extracted = {
        "customer_name": "Apex Engineering Works",
        "customer_email": "rajesh@apexeng.co.in",
        "line_items": [
            {
                "product_name": "Industrial Valve",
                "product_code": "",
                "material_grade": None,
                "quantity": 20,
                "requested_spec": "standard",
            }
        ],
        "payment_terms": "Net 30 days",
    }

    monkeypatch.setattr(
        llm_client,
        "generate_completion",
        lambda system_prompt, user_prompt: json.dumps(mock_extracted),
    )

    state = AgentState(
        rfq_id="TEST-REQ-001",
        raw_text="Please quote 20 units Industrial Valve, standard spec.",
    )

    updated_state = run_requirement_agent(state)

    assert updated_state.customer_name == "Apex Engineering Works"
    assert updated_state.customer_email == "rajesh@apexeng.co.in"

    reqs = updated_state.extracted_requirements
    assert "flags" in reqs
    assert len(reqs["flags"]) >= 1

    # Product code should be backfilled from catalogue
    assert reqs["line_items"][0]["product_code"] == "IV-200"

    # Agent trace should be recorded
    traces = [t for t in updated_state.agent_traces if t["agent_name"] == "Requirement Analysis Agent"]
    assert len(traces) == 1
    assert traces[0]["status"] == "SUCCESS"
    assert "flagged" in traces[0]["output_summary"]
