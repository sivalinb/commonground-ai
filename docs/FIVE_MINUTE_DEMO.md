# Five-Minute Demo Guide

## 0:00–0:35 — Problem and boundary

Open the Live Workflow page. Explain that CommonGround AI is a training copilot for restorative-justice and victim-services practitioners. It never determines guilt, credibility, remorse, mental health, risk, eligibility, or mandatory participation.

## 0:35–1:20 — Week 1: working application

Show the professional public interface, fictional scenario selector, jurisdiction control, evidence map, and architecture navigation. Explain that Codex was used iteratively to build, test, and deploy the application.

## 1:20–2:20 — Week 2: RAG pipeline

Run the fictional no-contact scenario. Follow the visible pipeline through Fireworks embedding, Pinecone and BM25 retrieval, reciprocal-rank fusion, Neo4j expansion, reranking, structured generation, and claim-level citations. Open one public source. Show that the prohibited-decision scenario stops instead of hallucinating.

## 2:20–3:15 — Week 3: agents and tools

Open AI Practice Lab. Explain the five specialized agents and demonstrate one fictional turn or Deepgram voice input. Show the evidence agent, participant response, facilitator coaching, victim-services review, and evaluator scorecard.

## 3:15–3:55 — Durable human review

Return to the live result. Explain that LangGraph interrupts before approval, D1 stores a privacy-minimized checkpoint, and a short-lived signed reviewer session is required. Approve or request revision and show that the graph resumes while no external action is taken.

## 3:55–4:35 — Evaluation and observability

Open Evaluations. Start with the versioned 200-case golden corpus and its exact 100/60/30/10 distribution. Explain that all 200 cases completed both the frozen baseline and improved GraphRAG configurations: 400 provider workflows, deterministic evaluation on every result, and independent Mistral judging on all 268 answer outputs. Compare safe completion, critical guardrails, Recall@5, complete expected-source coverage, faithfulness, trajectory, handoff, P95 latency, tokens, and estimated cost. Point out the passing zero-tolerance safety veto and four measured changes. Be explicit that the dataset is verified in LangSmith, while full experiment, pairwise, and human-review-queue persistence awaits renewed trace capacity. Then show the 48-case safety suite and 24-query retrieval suite. Open Trace and show case ID, stage timings, model agreement, token counts, and metadata-only LangSmith telemetry.

## 4:35–5:00 — Closing

Open Project Evidence. Summarize: the application foundation, measurable hybrid RAG, the multi-agent tool-using workflow with durable human control, and the controlled LangSmith baseline/post-improvement experiment. Close by noting that this is a training demonstration and agency deployment requires formal policy, security, privacy, legal, accessibility, records-retention, and independent human calibration review.
