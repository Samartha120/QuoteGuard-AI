"""Precision@3 for vector-only retrieval vs. the new hybrid (vector + keyword, +LLM
re-rank when a real LLM is configured) on the 8-case evaluation benchmark.

Ground truth: for each RFQ, every approved catalogue product code that literally appears
in the RFQ text is a code the catalogue search for that RFQ SHOULD surface. For each such
code, this scores whether a chunk containing that exact code appears in the top-3 results
of (a) vector search alone and (b) the hybrid retriever — the case hybrid retrieval exists
for: an exact code can paraphrase badly enough that vector similarity alone misses it.

Run from backend/ with the knowledge base already seeded (see capture_sample.py). On a
machine with sentence-transformers installed and DEMO_MODE=false, this also exercises the
LLM re-rank pass; without those, the vector side falls back to the deterministic hashing
embedder and re-rank auto-skips — still a fair comparison of the keyword-search addition,
just not a test of the LLM re-rank specifically. Re-run on a full setup for final numbers.
"""
import sys
sys.path.insert(0, '.')

from app.db.init_db import init_db
from app.db.session import SessionLocal
from app.db.models import KnowledgeDocument
from app.services.knowledge_service import upload_knowledge_document
from app.tools.pricing_catalog import get_catalog
from app.rag.vector_store import vector_store
from app.rag.retriever import retriever
from app.core.config import settings
import json
import os

init_db()
db = SessionLocal()
if db.query(KnowledgeDocument).count() == 0:
    for path, name, kind in [
        ("../data/company_catalog/product_catalog_2026.md", "product_catalog_2026.md", "catalog"),
        ("../data/pricing/approved_pricing_2026.csv", "approved_pricing_2026.csv", "pricing"),
        ("../data/policies/commercial_delivery_terms.md", "commercial_delivery_terms.md", "policy"),
    ]:
        if os.path.exists(path):
            upload_knowledge_document(db, path, name, kind)
db.close()

with open("../data/evaluation/test_dataset.json") as f:
    dataset = json.load(f)

catalog_codes = list(get_catalog().keys())
cases = []
for case in dataset:
    rfq_path = os.path.join("../data/rfqs", case["rfq_file"])
    if not os.path.exists(rfq_path):
        continue
    with open(rfq_path) as f:
        text = f.read()
    codes = [c for c in catalog_codes if c.lower() in text.lower()]
    for code in codes:
        cases.append({"eval_id": case["eval_id"], "code": code, "doc_type": "catalog"})

# Adversarial policy-term cases: commercial_delivery_terms.md says "30" three different
# ways (Net 30 Days, 30% advance, 30 calendar days validity) in three different sections.
# "Net 30" is the exact phrase the retrieval plan actually searches with when payment
# terms need checking (see RETRIEVAL_PLANNING_PROMPT) — this is the case hybrid retrieval
# exists for: picking the one section that says it, not just any "30" mention.
for term in ["Net 30", "ex-works Pune"]:
    cases.append({"eval_id": "policy", "code": term, "doc_type": "policy"})

print(f"DEMO_MODE={settings.DEMO_MODE}  ground-truth (RFQ, term) pairs: {len(cases)}\n")


def hit_at_1(results, code):
    return bool(results) and code.lower() in (results[0].get("content") or "").lower()


vector_hits, hybrid_hits = 0, 0
rows = []
for case in cases:
    code = case["code"]
    doc_type = case["doc_type"]
    vector_results = vector_store.search(query=code, top_k=3, where_filter={"doc_type": doc_type})
    hybrid_results = retriever.retrieve_evidence(query=code, top_k=3, doc_type=doc_type)

    v_hit = hit_at_1(vector_results, code)
    h_hit = hit_at_1(hybrid_results, code)
    vector_hits += v_hit
    hybrid_hits += h_hit
    rows.append((case["eval_id"], code, v_hit, h_hit))

print(f"{'case':<10}{'code':<10}{'vector-only top-1':<20}{'hybrid top-1':<14}")
for eval_id, code, v_hit, h_hit in rows:
    flag = "  <- fixed" if (h_hit and not v_hit) else ""
    print(f"{eval_id:<10}{code:<10}{'hit' if v_hit else 'miss':<20}{'hit' if h_hit else 'miss':<14}{flag}")

n = len(cases) or 1
print(f"\nPrecision@1 (exact-code ranked first), vector-only: {vector_hits}/{n} = {100*vector_hits/n:.1f}%")
print(f"Precision@1 (exact-code ranked first), hybrid:      {hybrid_hits}/{n} = {100*hybrid_hits/n:.1f}%")
