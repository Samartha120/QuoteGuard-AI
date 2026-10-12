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


def test_run_requirement_agent_offline_heuristic_fallback(monkeypatch):
    """Verify zero-fail resilience: when LLM raises LLMUnavailableError, the agent
    falls back to deterministic NLP heuristic extraction without crashing."""
    from app.llm.client import LLMUnavailableError

    def failing_llm(system_prompt, user_prompt):
        raise LLMUnavailableError("Groq/OpenAI provider offline or circuit-broken")

    monkeypatch.setattr(llm_client, "generate_completion", failing_llm)

    state = AgentState(
        rfq_id="TEST-FALLBACK-002",
        raw_text="Customer Name: Narmada Pipeline Projects Pvt. Ltd.\n"
                 "Contact Person: Meera Iyer (Purchase Head)\n"
                 "Email: purchase@narmadapipeline.in\n"
                 "Please quote:\n"
                 "1. Industrial Valve IV-200, SS304 body, PN16 - Quantity: 60 units\n"
                 "2. Flange Plate FP-50, Carbon Steel - Quantity: 250 units\n"
                 "Terms: Net 30 days, Ex-works Pune."
    )

    result_state = run_requirement_agent(state)

    assert result_state.customer_name == "Narmada Pipeline Projects Pvt. Ltd."
    assert result_state.customer_email == "purchase@narmadapipeline.in"
    
    line_items = result_state.extracted_requirements.get("line_items", [])
    assert len(line_items) == 2
    
    codes = [item["product_code"] for item in line_items]
    assert "IV-200" in codes
    assert "FP-50" in codes

    trace = [t for t in result_state.agent_traces if t["agent_name"] == "Requirement Analysis Agent"][0]
    assert trace["status"] == "SUCCESS"
    assert trace["mode"] == "HEURISTIC_FALLBACK"


def test_resolve_catalogue_specs_and_out_of_catalog():
    """Verify catalog disambiguation tool identifies in-catalog vs out-of-catalog items."""
    from app.agents.requirement_agent import resolve_catalogue_specs

    items = [
        {"product_name": "Pressure Relief Valve", "product_code": "", "material_grade": "ss304"},
        {"product_name": "Butterfly Valve BV-150", "product_code": "BV-150", "material_grade": "Cast Iron"},
    ]

    res = resolve_catalogue_specs(items)

    assert items[0]["product_code"] == "PV-100"
    assert items[0]["in_catalogue"] is True
    assert items[0]["material_grade"] == "SS304"

    assert items[1]["product_code"] == "BV-150"
    assert items[1]["in_catalogue"] is False
    assert "BV-150" in res["unmatched_items"]


def test_normalize_quantities_and_units():
    """Verify standardizing string quantities and range preservation."""
    from app.agents.requirement_agent import normalize_quantities_and_units

    items = [
        {"product_name": "IV-200", "quantity": "around 30 to 40 pieces"},
        {"product_name": "PV-100", "quantity": "25 units"},
        {"product_name": "FP-50", "quantity": 10},
    ]

    normalize_quantities_and_units(items)

    assert items[0]["quantity"] == 40
    assert items[0]["is_quantity_range"] is True
    assert items[0]["raw_quantity"] == "around 30 to 40 pieces"

    assert items[1]["quantity"] == 25
    assert items[2]["quantity"] == 10


def test_compute_extraction_confidence_scoring():
    """Verify extraction confidence calculation penalizes missing fields and ambiguities."""
    from app.agents.requirement_agent import compute_extraction_confidence

    complete_reqs = {
        "customer_name": "Apex Engineering",
        "customer_email": "test@apex.com",
        "line_items": [
            {
                "product_name": "Industrial Valve IV-200",
                "product_code": "IV-200",
                "material_grade": "SS304",
                "quantity": 20,
                "requested_spec": "Standard SS304 body with PTFE seals",
            }
        ]
    }
    res_complete = compute_extraction_confidence(complete_reqs, flags=[])
    assert res_complete["overall_extraction_confidence"] >= 0.90

    ambiguous_reqs = {
        "customer_name": "Apex Engineering",
        "line_items": [
            {
                "product_name": "Industrial Valve",
                "product_code": None,
                "material_grade": None,
                "quantity": None,
                "requested_spec": "standard",
            }
        ]
    }
    flags = [{"item": "Industrial Valve", "type": "missing_grade"}]
    res_ambiguous = compute_extraction_confidence(ambiguous_reqs, flags=flags)
    assert res_ambiguous["overall_extraction_confidence"] < 0.50


def test_general_enquiry_zero_items_extraction():
    """Verify that general inquiries (no products requested) return zero line items cleanly."""
    from app.agents.requirement_agent import heuristic_extract_requirements

    enquiry_text = (
        "Dear Vertex Industrial Supplies,\n"
        "We are Orbit Infra Developers. Could you please send us your latest product brochure "
        "and company profile for our upcoming project?\n"
        "Best regards,\nNeha Kulkarni\nOrbit Infra Developers"
    )

    parsed = heuristic_extract_requirements(enquiry_text)
    assert parsed["customer_name"] == "Orbit Infra Developers"
    assert len(parsed["line_items"]) == 0

