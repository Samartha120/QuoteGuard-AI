#!/usr/bin/env python3
"""Export a real, unedited multi-agent execution trace from QuoteGuard AI.

This runs the LangGraph supervisor orchestrator on an RFQ and exports the full final
AgentState (including orchestrator_decisions, messages/handoffs, validation_plan,
critic_feedback, and retrieved evidence) to a JSON file.
"""

import argparse
import json
import os
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.agents.state import AgentState
from app.agents.workflow import workflow_orchestrator


def export_trace(rfq_path: Path, output_path: Path) -> dict:
    if not rfq_path.exists():
        raise FileNotFoundError(f"RFQ file not found at: {rfq_path}")

    raw_text = rfq_path.read_text(encoding="utf-8")
    
    # Infer basic metadata
    customer_name = "Zenith Chemical Processing Ltd."
    customer_email = "a.sharma@zenithchem.com"
    if "Apex" in raw_text:
        customer_name = "Apex Engineering Works Ltd."
        customer_email = "procurement@apexeng.co.in"

    initial_state = AgentState(
        rfq_id="demo-rfq-2-zenith",
        raw_text=raw_text,
        customer_name=customer_name,
        customer_email=customer_email,
    )

    print(f"Running QuoteGuard Multi-Agent Workflow on {rfq_path.name}...")
    final_state = workflow_orchestrator.run_pipeline(initial_state)

    trace_data = final_state.model_dump()

    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(trace_data, indent=2), encoding="utf-8")
    print(f"Successfully saved execution trace to: {output_path}")
    print(f"Decisions: {len(trace_data.get('orchestrator_decisions', []))}")
    print(f"Messages / Handoffs: {len(trace_data.get('messages', []))}")
    print(f"Grounding Status: {trace_data.get('grounded_status')}")
    print(f"Abstention Required: {trace_data.get('abstention_required')}")
    return trace_data


def main():
    parser = argparse.ArgumentParser(description="Export real execution trace from QuoteGuard AI.")
    parser.add_argument(
        "--rfq",
        type=str,
        default=str(backend_dir.parent / "data" / "rfqs" / "demo_rfq_2_ambiguous.txt"),
        help="Path to the RFQ input file (default: demo_rfq_2_ambiguous.txt)",
    )
    parser.add_argument(
        "--out",
        type=str,
        default=str(backend_dir.parent / "docs" / "EXECUTION_TRACE_SAMPLE.json"),
        help="Path to write the execution trace JSON (default: docs/EXECUTION_TRACE_SAMPLE.json)",
    )
    args = parser.parse_args()

    export_trace(Path(args.rfq), Path(args.out))


if __name__ == "__main__":
    main()
