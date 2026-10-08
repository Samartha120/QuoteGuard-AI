import time
import json
import os
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from sqlalchemy.orm import Session

from app.db.models import EvaluationRun, RFQ, Quotation, AgentRun
from app.agents.state import AgentState
from app.agents.workflow import workflow_orchestrator
from app.services.agent_metrics import score_case, summarize as summarize_agents
from app.core.config import settings
from app.core.logging import logger


def _load_dataset(dataset_path: Optional[str] = None) -> List[Dict[str, Any]]:
    path = dataset_path or settings.EVAL_DATASET_PATH
    if not os.path.exists(path):
        logger.warning(f"Evaluation dataset not found at {path}")
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def _read_rfq_text(rfq_file: str) -> Optional[str]:
    path = os.path.join(settings.RFQ_SAMPLES_DIR, rfq_file)
    if not os.path.exists(path):
        logger.warning(f"RFQ sample not found: {path}")
        return None
    with open(path, "r", encoding="utf-8") as f:
        return f.read()


def _norm_expected(status: str) -> str:
    return "GROUNDED" if str(status).lower() == "grounded" else "ABSTAINED"


def _pct(values: List[float]) -> float:
    return round((sum(values) / len(values)) * 100, 1) if values else 0.0

def run_evaluation_benchmark(db: Session, dataset_path: str = None) -> EvaluationRun:
    """Runs the REAL 5-stage agent pipeline over the evaluation test dataset and
    computes empirical metrics by comparing actual outcomes against expected labels.
    The pipeline runs in-memory (no operational RFQ/Quotation rows are persisted);
    only the aggregate EvaluationRun is stored."""
    dataset = _load_dataset(dataset_path)

    case_results: List[Dict[str, Any]] = []
    latencies: List[float] = []
    confidences_grounded: List[float] = []
    extraction_ratios: List[float] = []
    retrieval_precisions: List[float] = []

    expected_abstain_total = 0
    correct_abstain = 0
    hallucinations = 0  # expected abstention but produced a grounded/confident quote

    for case in dataset:
        raw_text = _read_rfq_text(case.get("rfq_file", ""))
        if raw_text is None:
            continue

        state = AgentState(
            rfq_id=case.get("eval_id", "eval"),
            raw_text=raw_text,
            customer_name=case.get("customer", ""),
        )
        t0 = time.time()
        try:
            final = workflow_orchestrator.run_pipeline(state)
        except Exception as e:  # defensive: a single bad case must not fail the suite
            logger.error(f"Benchmark case {case.get('eval_id')} failed: {e}")
            case_results.append({
                "eval_id": case.get("eval_id"),
                "customer": case.get("customer"),
                "result": "ERROR",
                "error": str(e),
            })
            continue
        latency_ms = (time.time() - t0) * 1000.0
        latencies.append(latency_ms)

        actual_status = final.grounded_status  # GROUNDED / ABSTAINED
        expected_status = _norm_expected(case.get("expected_status", "grounded"))
        status_correct = actual_status == expected_status

        line_items = final.quotation_draft.get("line_items", [])
        actual_abstentions = sum(1 for li in line_items if li.get("status") == "abstained")

        extracted_items = final.extracted_requirements.get("line_items", [])
        expected_items = max(int(case.get("expected_line_items", len(extracted_items) or 1)), 1)
        extraction_ratios.append(min(1.0, len(extracted_items) / expected_items))

        evidence = final.retrieved_evidence or []
        grounded_ev = sum(1 for ev in evidence if ev.get("is_grounded"))
        retrieval_precisions.append((grounded_ev / len(evidence)) if evidence else 0.0)

        if expected_status == "GROUNDED":
            confidences_grounded.append(final.overall_confidence or 0.0)
        else:
            expected_abstain_total += 1
            if actual_status == "ABSTAINED":
                correct_abstain += 1
            else:
                hallucinations += 1

        case_results.append({
            "eval_id": case.get("eval_id"),
            "customer": case.get("customer"),
            "expected_status": expected_status,
            "actual_status": actual_status,
            "expected_line_items": case.get("expected_line_items"),
            "actual_line_items": len(line_items),
            "expected_abstentions": case.get("expected_abstentions"),
            "actual_abstentions": actual_abstentions,
            "overall_confidence": final.overall_confidence,
            "latency_ms": round(latency_ms, 1),
            "result": "PASS" if status_correct else "FAIL",
            "agents": score_case(case, final),
        })

    grounding_rate = _pct(confidences_grounded)
    requirement_extraction_accuracy = _pct(extraction_ratios)
    retrieval_precision = _pct(retrieval_precisions)
    abstention_accuracy = round((correct_abstain / expected_abstain_total) * 100, 1) if expected_abstain_total else 100.0
    hallucination_rate = round((hallucinations / expected_abstain_total) * 100, 1) if expected_abstain_total else 0.0
    avg_latency_ms = round(sum(latencies) / len(latencies), 1) if latencies else 0.0
    estimated_api_cost = 0.0 if settings.DEMO_MODE else round(0.0015 * max(len(case_results), 1), 4)

    passed = sum(1 for c in case_results if c.get("result") == "PASS")
    overall = "NO_DATA"
    if case_results:
        overall = "PASSED" if passed == len(case_results) else ("PARTIAL" if passed else "FAILED")

    eval_run = EvaluationRun(
        run_timestamp=datetime.now(timezone.utc),
        grounding_rate=grounding_rate,
        hallucination_rate=hallucination_rate,
        abstention_accuracy=abstention_accuracy,
        requirement_extraction_accuracy=requirement_extraction_accuracy,
        retrieval_precision=retrieval_precision,
        avg_latency_ms=avg_latency_ms,
        estimated_api_cost=estimated_api_cost,
        summary_json={
            "benchmark_dataset": os.path.basename(dataset_path or settings.EVAL_DATASET_PATH),
            "demo_mode": settings.DEMO_MODE,
            "grounding_threshold": settings.GROUNDING_THRESHOLD,
            "test_cases_evaluated": len(case_results),
            "cases_passed": passed,
            "cases": case_results,
            "agent_metrics": summarize_agents([c["agents"] for c in case_results if "agents" in c]),
            "status": overall,
        },
    )
    db.add(eval_run)
    db.commit()
    db.refresh(eval_run)
    logger.info(f"Evaluation benchmark complete: {passed}/{len(case_results)} cases passed")
    return eval_run


def get_latest_evaluation_summary(db: Session) -> EvaluationRun:
    run = db.query(EvaluationRun).order_by(EvaluationRun.run_timestamp.desc()).first()
    if not run:
        return run_evaluation_benchmark(db)
    return run


def list_evaluation_runs(db: Session, limit: int = 30) -> List[EvaluationRun]:
    return db.query(EvaluationRun).order_by(EvaluationRun.run_timestamp.desc()).limit(limit).all()

def _parse_date(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def _daykey(dt) -> str:
    return dt.date().isoformat() if dt else "unknown"


def _series_from_counts(counts: Dict[str, float]) -> List[Dict[str, Any]]:
    return [{"date": k, "value": round(v, 2)} for k, v in sorted(counts.items()) if k != "unknown"]


def get_evaluation_analytics(
    db: Session,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    status: Optional[str] = None,
    customer: Optional[str] = None,
    agent: Optional[str] = None,
) -> Dict[str, Any]:
    """Computes dynamic evaluation analytics from real operational records
    (RFQs, quotations, agent runs), honoring the supplied filters. Returns
    has_data=False when no records match so the UI can show an empty state."""
    start_dt = _parse_date(start_date)
    end_dt = _parse_date(end_date)

    rfq_q = db.query(RFQ)
    if start_dt:
        rfq_q = rfq_q.filter(RFQ.created_at >= start_dt)
    if end_dt:
        rfq_q = rfq_q.filter(RFQ.created_at <= end_dt)
    if status:
        rfq_q = rfq_q.filter(RFQ.status == status)
    if customer:
        rfq_q = rfq_q.filter(RFQ.customer_name.ilike(f"%{customer}%"))
    rfqs = rfq_q.all()
    rfq_ids = [r.id for r in rfqs]
    rfq_day = {r.id: _daykey(r.created_at) for r in rfqs}

    quotations = db.query(Quotation).filter(Quotation.rfq_id.in_(rfq_ids)).all() if rfq_ids else []

    ar_q = db.query(AgentRun).filter(AgentRun.rfq_id.in_(rfq_ids)) if rfq_ids else None
    if ar_q is not None and agent:
        ar_q = ar_q.filter(AgentRun.agent_name.ilike(f"%{agent}%"))
    agent_runs = ar_q.all() if ar_q is not None else []

    total_rfqs = len(rfqs)
    total_quotations = len(quotations)
    has_data = total_rfqs > 0 or total_quotations > 0
    # --- Grounding distribution (from RFQ + quotation statuses) ---
    grounded_count = sum(1 for r in rfqs if r.status == "GROUNDED")
    clarification_count = sum(1 for r in rfqs if r.status == "CLARIFICATION_REQUIRED")
    abstained_count = sum(1 for q in quotations if q.grounded_status == "ABSTAINED")
    unverified_count = sum(1 for q in quotations if q.grounded_status == "UNVERIFIED")
    grounding_distribution = [
        {"label": "Grounded", "value": grounded_count},
        {"label": "Clarification", "value": clarification_count},
        {"label": "Abstained", "value": abstained_count},
        {"label": "Unverified", "value": unverified_count},
    ]

    # --- Time series (grouped by day in Python for SQLite safety) ---
    rfqs_per_day_counts: Dict[str, float] = {}
    grounded_per_day: Dict[str, float] = {}
    for r in rfqs:
        day = rfq_day.get(r.id, "unknown")
        rfqs_per_day_counts[day] = rfqs_per_day_counts.get(day, 0) + 1
        if r.status == "GROUNDED":
            grounded_per_day[day] = grounded_per_day.get(day, 0) + 1

    # grounding-over-time as a daily percentage of grounded RFQs
    grounding_over_time: List[Dict[str, Any]] = []
    for day in sorted(rfqs_per_day_counts.keys()):
        if day == "unknown":
            continue
        total = rfqs_per_day_counts[day]
        grounded = grounded_per_day.get(day, 0)
        grounding_over_time.append({"date": day, "value": round((grounded / total) * 100, 1) if total else 0.0})

    # latency-over-time from agent run execution times, averaged per day
    latency_sums: Dict[str, float] = {}
    latency_counts: Dict[str, float] = {}
    for ar in agent_runs:
        day = rfq_day.get(ar.rfq_id, _daykey(ar.created_at))
        if ar.execution_time_ms is not None:
            latency_sums[day] = latency_sums.get(day, 0.0) + float(ar.execution_time_ms)
            latency_counts[day] = latency_counts.get(day, 0.0) + 1
    latency_over_time = [
        {"date": day, "value": round(latency_sums[day] / latency_counts[day], 1)}
        for day in sorted(latency_sums.keys())
        if day != "unknown" and latency_counts.get(day)
    ]

    # --- Agent success rates ---
    agent_totals: Dict[str, int] = {}
    agent_success: Dict[str, int] = {}
    for ar in agent_runs:
        agent_totals[ar.agent_name] = agent_totals.get(ar.agent_name, 0) + 1
        if ar.status in ("SUCCESS", "WARNING"):
            agent_success[ar.agent_name] = agent_success.get(ar.agent_name, 0) + 1
    agent_success_rates = [
        {
            "agent": name,
            "success_rate": round((agent_success.get(name, 0) / total) * 100, 1) if total else 0.0,
            "runs": total,
        }
        for name, total in sorted(agent_totals.items())
    ]
    # --- Headline metrics from operational data ---
    total_agent_runs = len(agent_runs)
    successful_agent_runs = sum(1 for ar in agent_runs if ar.status in ("SUCCESS", "WARNING"))
    validation_runs = [ar for ar in agent_runs if "valid" in (ar.agent_name or "").lower()]
    validation_pass = sum(1 for ar in validation_runs if ar.status == "SUCCESS")
    all_latencies = [float(ar.execution_time_ms) for ar in agent_runs if ar.execution_time_ms is not None]

    grounding_score_avg = round(
        (sum(q.overall_confidence or 0.0 for q in quotations) / total_quotations) * 100, 1
    ) if total_quotations else 0.0
    quotation_success_rate = round(
        (sum(1 for q in quotations if q.status == "APPROVED") / total_quotations) * 100, 1
    ) if total_quotations else 0.0
    clarification_rate = round(
        (sum(1 for r in rfqs if r.status == "CLARIFICATION_REQUIRED") / total_rfqs) * 100, 1
    ) if total_rfqs else 0.0
    validation_pass_rate = round((validation_pass / len(validation_runs)) * 100, 1) if validation_runs else 0.0
    op_avg_latency_ms = round(sum(all_latencies) / len(all_latencies), 1) if all_latencies else 0.0

    # Metrics best sourced from the benchmark suite (real dataset run)
    latest_eval = db.query(EvaluationRun).order_by(EvaluationRun.run_timestamp.desc()).first()
    retrieval_relevance = latest_eval.retrieval_precision if latest_eval else 0.0
    extraction_accuracy = latest_eval.requirement_extraction_accuracy if latest_eval else 0.0
    hallucination_rate = latest_eval.hallucination_rate if latest_eval else 0.0
    abstention_accuracy = latest_eval.abstention_accuracy if latest_eval else 0.0

    return {
        "has_data": has_data,
        "filters": {
            "start_date": start_date,
            "end_date": end_date,
            "status": status,
            "customer": customer,
            "agent": agent,
        },
        "headline": {
            "total_rfqs": total_rfqs,
            "total_quotations": total_quotations,
            "grounding_score_avg": grounding_score_avg,
            "retrieval_relevance": retrieval_relevance,
            "extraction_accuracy": extraction_accuracy,
            "validation_pass_rate": validation_pass_rate,
            "avg_latency_ms": op_avg_latency_ms,
            "quotation_success_rate": quotation_success_rate,
            "clarification_rate": clarification_rate,
            "hallucination_rate": hallucination_rate,
            "abstention_accuracy": abstention_accuracy,
            "agent_success_rate": round((successful_agent_runs / total_agent_runs) * 100, 1) if total_agent_runs else 0.0,
        },
        "time_series": {
            "rfqs_per_day": _series_from_counts(rfqs_per_day_counts),
            "grounding_over_time": grounding_over_time,
            "latency_over_time": latency_over_time,
        },
        "grounding_distribution": grounding_distribution,
        "agent_success_rates": agent_success_rates,
    }




