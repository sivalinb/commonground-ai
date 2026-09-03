# CommonGround AI — Week 1–4 Cumulative Project Report

## Project overview

CommonGround AI is a training-only, victim-centered restorative-justice practice copilot. It helps restorative-justice volunteers, facilitators, victim advocates, instructors, and public-safety partners explore safer options grounded in approved public guidance. It never determines guilt, credibility, remorse, mental health, risk, legal eligibility, or whether anyone must participate.

Public demo: https://commonground-rj-ai.siva-babu.chatgpt.site/

Source code: https://github.com/sivalinb/commonground-ai

### Verification snapshot

Documentation and provider behavior were rechecked on September 2, 2026. The public demo, GitHub source, submission documents, and executable evaluation reports agree on the current system scope and measured results. The quality workflow covers type checking, linting, 47 deterministic unit tests, the 48-case safety suite, 24-query retrieval preflight, the 40-case benchmark validator, the 200-case v2 golden-dataset validator, and the production build.

## Week 1 — Data application with vibe coding

### Problem statement

Restorative-justice learners need a practical way to rehearse victim-centered language, inspect evidence, and see where AI must stop. Static training material does not make retrieval quality, safety gates, or model behavior visible.

### What was built

- A responsive React and TypeScript application created through an iterative Codex workflow.
- Interactive fictional scenarios, filters, scorecards, evidence views, architecture maps, and trace timelines.
- Public deployment with a reproducible GitHub quality workflow.
- A professional interface understandable to both technical reviewers and restorative-justice practitioners.

### AI-assisted development workflow

The project was developed iteratively: first the working case-analysis surface, then RAG, safety gates, multi-agent practice, observability, GraphRAG, voice, abuse controls, and finally rubric evidence. Each stage was compiled, tested, reviewed, and deployed before the next stage.

## Week 2 — Evaluated RAG application

### RAG one-liner

CommonGround AI helps restorative-justice and victim-services practitioners explore training questions from 10 approved public guidance sources in a web application, targeting at least 85% Recall@5, 90% claim faithfulness, 95% citation precision, 90% correct abstention, and a 15-second P95 response time.

### Corpus

The versioned corpus contains 10 attributed public-source summaries from the U.S. Department of Justice Office for Victims of Crime, Colorado Commission on Criminal and Juvenile Justice, and StopBullying.gov. Each record includes an ID, title, section, source URL, jurisdiction, safeguard topic, and reviewed text. The checked-in corpus is the source of truth; external search results cannot publish themselves into it.

### Ingestion, cleaning, and freshness

- Source text is reduced to short, reviewable evidence passages rather than ingesting entire pages blindly.
- Each passage is normalized into structured metadata before embedding.
- Idempotent scripts seed the approved records into Pinecone and Neo4j.
- You.com searches only allowlisted public domains and produces curator candidates.
- A human curator must review the full source, effective date, jurisdiction, and material change before updating the corpus.

### Chunking and embeddings

The current small corpus uses one semantically complete policy passage per evidence record. This avoids splitting a safeguard across chunks and keeps citations inspectable. Fireworks Qwen3 creates 256-dimensional embeddings aligned with the configured Pinecone index.

### Retrieval pipeline

1. Fireworks creates the query embedding.
2. Pinecone returns dense semantic matches from the isolated namespace.
3. Local BM25 returns exact-term matches.
4. Reciprocal-rank fusion combines dense and lexical rankings.
5. Neo4j expands related evidence through safeguard and jurisdiction relationships.
6. Fireworks reranks the candidates before generation.
7. The generator returns schema-constrained claims with evidence IDs.
8. Deterministic citation validation and two model reviewers can withhold the result.

### Evaluation

The repository contains a 24-query retrieval dataset covering direct, multi-document, Colorado-specific, youth-safety, multi-hop, and out-of-corpus questions. Deterministic preflight runs in CI. Provider-backed mode evaluates the live pipeline, uses Mistral as an independent claim-faithfulness judge, and compares vector-only, hybrid, and GraphRAG retrieval on 10 shared queries.

### Measured production results

The September 1, 2026 provider-backed run passed all 24 tasks and every declared release target: 94.2% Recall@5, 94.2% mean reciprocal rank, 97% citation precision, 100% claim faithfulness, 100% correct abstention, and 7.93-second P95 latency. The controlled 10-query ablation measured 100% Recall@5 and task success for GraphRAG, compared with 70% for both vector-only and hybrid modes. These are versioned experimental results over the synthetic course dataset, not claims about field effectiveness.

## Week 3 — Agentic AI system

### Agent one-liner

CommonGround AI helps restorative-justice learners complete a victim-centered practice workflow in a public web application, replacing disconnected manual searching and self-review. It retrieves evidence and coordinates specialized agents using multiple tools, hands off every reviewable brief to a human, and succeeds when the workflow returns cited, safe guidance or correctly abstains within the declared quality and latency targets.

### Control flow and agents

The main LangGraph decides among refusal, retrieval, graph expansion, generation, safety review, cross-provider review, and human approval. The separate Practice Lab coordinates five specialized agents: evidence retriever, fictional participant, facilitator coach, victim-services reviewer, and observer evaluator.

### Tools and actions

- Fireworks: embeddings, reranking, structured generation, coaching, and primary safety review.
- Pinecone: vector lookup.
- Neo4j: relationship expansion.
- Mistral: independent safety and faithfulness evaluation.
- Deepgram: transcription and bilingual read-aloud.
- You.com: allowlisted public-source discovery.
- LangSmith: metadata-only traces and evaluator feedback.

All provider actions are reads or draft generation. The application does not send messages, create referrals, change agency records, determine eligibility, or take enforcement action.

### State, human handoff, and recovery

- LangGraph holds typed state across workflow steps.
- A real LangGraph `GraphInterrupt` pauses the graph before approval and `Command({ resume })` continues it after review.
- A Cloudflare D1 checkpointer persists only the minimum control state required to resume.
- Raw narratives, vectors, evidence excerpts, safety text, and generated briefs are stripped before checkpoint persistence.
- A short-lived signed reviewer token is bound to the approval ID.
- Duplicate or expired approvals are rejected.
- Provider calls have timeouts and bounded retries; deterministic failures stop safely.

## Week 4 — Agent evaluation and improvement

The CommonGround Guidance Agent is evaluated as a single defined system. The immutable `commonground-rj-week4-200-v2` LangSmith golden dataset contains 100 happy paths, 60 edge cases, 30 known failures, and 10 adversarial cases. It includes the original 40-case provider-tested benchmark core plus a 160-case coverage extension. Every case includes an expected disposition, expected sources, critical-safety flag, tags, reference rationale, and autonomy/trauma/handoff labels.

The frozen baseline uses hybrid retrieval, five candidates, top-three reranking, no graph expansion, and the prior prompt. The improved agent adds Neo4j GraphRAG expansion, eight candidates, top-five reranking, GraphRAG-aware confidence, explicit unsupported-request abstention, autonomy-focused examples, and stronger retry recovery. Both configurations completed all 200 golden cases, producing 400 provider results. Deterministic code evaluators covered every result, and the independent Mistral judge scored all 269 answer outputs: 139 baseline answers plus 130 improved answers. The improved configuration passed the zero-tolerance critical-safety veto and 15 of 16 numeric thresholds, while measuring a 94.4% LLM handoff score against the predeclared 95% bar. It retained 100% Recall@5, 88.6% complete expected-source coverage@5, 99.6% claim faithfulness, and 7.5-second P95 latency.

The provider-backed September 2 run records safe task completion, critical guardrail compliance, Recall@5, full expected-source coverage, citation validity, independent Mistral faithfulness/autonomy/trauma/handoff scores, trajectory correctness, p50/p95 latency, tokens, normalized cost, case-level trace IDs, and failure clusters. The detailed baseline/post-improvement results are generated in `docs/WEEK_4_EVALUATION_REPORT.md`.

### Evaluator design

- Deterministic code checks exact disposition, privacy and prohibited gates, schema, PII leakage, source IDs, citation integrity and coverage, retrieval, model safety, trajectory, handoff, latency, cost, and provider/tool success.
- A native asynchronous Mistral LangSmith evaluator uses an anchored 0–4 rubric for claim faithfulness, autonomy, trauma-aware language, human handoff, and overall RJ quality; it also returns reason codes and a critical-failure decision.
- A randomized, blinded Mistral pairwise evaluator compares the baseline and GraphRAG candidate without replacing the absolute safety gates.
- A trajectory evaluator checks required LangGraph stages and correct early stops.
- Manually specified reference labels define expected behavior; a deterministic 30-case sample and LangSmith annotation-queue workflow support blinded RJ and victim-services calibration at 85% overall agreement, 100% critical-case agreement, and zero false-safe cases.
- A critical-safety veto runs before the weighted explanatory quality score, so no average can hide a PII, guardrail, or judge-critical failure.

The versioned 200-case dataset is verified in LangSmith, and one full-path synthetic case trace is published with nine child runs and evaluator feedback. Full new experiment traces, randomized pairwise results, and the 30-case annotation queue are implemented but remain pending because the current LangSmith monthly trace allowance is exhausted. The complete provider and judge evidence is preserved locally and checked into the repository; independent human calibration remains required before any agency-use claim.

### Production monitoring

The monitoring contract alerts on quality drift below safe completion, guardrail, faithfulness, retrieval, and handoff thresholds; latency or cost regression above the declared ceilings; and provider/tool failures above two percent. Raw operational narratives remain excluded from LangSmith.

## Development iterations

1. Built the public case-analysis workspace and fictional scenarios.
2. Added structured Fireworks generation and cited public evidence.
3. Added Pinecone dense retrieval, BM25, reciprocal-rank fusion, and reranking.
4. Added privacy screening, prohibited-decision rules, abstention, and citation validation.
5. Added LangGraph orchestration, specialized practice agents, and human review.
6. Added LangSmith metadata-only observability and versioned safety evaluations.
7. Added You.com freshness research with curator-only publication boundaries.
8. Added Neo4j GraphRAG, Mistral cross-provider review, and Deepgram voice.
9. Added Cloudflare Turnstile, D1 rate records, and production quality gates.
10. Added durable LangGraph checkpoint/resume, signed reviewer sessions, retrieval metrics, provider-backed faithfulness evaluation, and course-evidence documentation.
11. Added the 40-case provider-tested benchmark core, frozen baseline, four targeted improvements, case-linked evaluators, failure clustering, cost/latency measurements, and post-improvement comparison.
12. Expanded the immutable LangSmith golden corpus to 200 cases with exact 50/30/15/5 split coverage, 87 critical cases, source-integrity checks, deterministic safety-trigger validation, and a reviewer-calibration boundary.
13. Ran the complete 200-case baseline and improved configurations, applied code evaluators to all 400 results and Mistral judging to 269 answer outputs, added a safety-first release gate, resumable checkpoints, and a public evidence summary.

## What was learned

- Retrieval quality and evidence design matter more than adding another general-purpose model.
- Hybrid retrieval improves exact-term coverage while embeddings capture semantic intent.
- Graph relationships are useful for multi-hop safeguard and jurisdiction connections, but require ablation evidence to justify their complexity.
- Model-based safety review must be paired with deterministic boundaries, structured outputs, abstention, and human authority.
- Observability should measure latency, citations, grounding, model agreement, failures, and versions without logging sensitive narratives.
- Human-in-the-loop is not complete until the workflow can durably pause, verify the reviewer session, reject replay, and resume.

## Limitations and operational boundary

This is a portfolio and training demonstration over a small public corpus. It is not an agency case system or a comprehensive statement of law or policy. Real deployment requires local policy curation, authenticated agency roles, accessibility review, records-retention decisions, procurement, security testing, legal review, and victim-services governance.
