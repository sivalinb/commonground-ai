# CommonGround AI — Week 1–3 Cumulative Project Report

## Project overview

CommonGround AI is a training-only, victim-centered restorative-justice practice copilot. It helps restorative-justice volunteers, facilitators, victim advocates, instructors, and public-safety partners explore safer options grounded in approved public guidance. It never determines guilt, credibility, remorse, mental health, risk, legal eligibility, or whether anyone must participate.

Public demo: https://commonground-rj-ai.siva-babu.chatgpt.site/

Source code: https://github.com/sivalinb/commonground-ai

### Verification snapshot

Documentation and production behavior were rechecked on September 1, 2026. The public demo, GitHub source, four submission documents, and deployed evaluation report agree on the current system scope and measured results. The latest quality workflow passes type checking, linting, 31 deterministic unit tests, the 48-case safety suite, and the production build.

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

The current small corpus uses one semantically complete policy passage per evidence record. This avoids splitting a safeguard across chunks and keeps citations inspectable. Fireworks Qwen3 creates 1,024-dimensional embeddings aligned with the Pinecone index.

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

## What was learned

- Retrieval quality and evidence design matter more than adding another general-purpose model.
- Hybrid retrieval improves exact-term coverage while embeddings capture semantic intent.
- Graph relationships are useful for multi-hop safeguard and jurisdiction connections, but require ablation evidence to justify their complexity.
- Model-based safety review must be paired with deterministic boundaries, structured outputs, abstention, and human authority.
- Observability should measure latency, citations, grounding, model agreement, failures, and versions without logging sensitive narratives.
- Human-in-the-loop is not complete until the workflow can durably pause, verify the reviewer session, reject replay, and resume.

## Limitations and operational boundary

This is a portfolio and training demonstration over a small public corpus. It is not an agency case system or a comprehensive statement of law or policy. Real deployment requires local policy curation, authenticated agency roles, accessibility review, records-retention decisions, procurement, security testing, legal review, and victim-services governance.
