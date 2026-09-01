# Prompts and Iterations

This log summarizes the AI-assisted development instructions used to build CommonGround AI. It records intent without including credentials, private data, or hidden provider instructions.

## Initial product prompt

> Build an end-to-end public website demonstrating an impactful restorative-justice and victim-services AI project. Make it easy for students, practitioners, and law-enforcement partners to understand. Use APIs, models, a vector database, evaluation, and observability while preserving human judgment.

## RAG iteration

> Add an approved public evidence corpus, embeddings, Pinecone vector search, keyword retrieval, rank fusion, reranking, citations, confidence-based abstention, and visible retrieval scores. Keep search results from automatically entering the approved corpus.

## Agentic workflow iteration

> Convert the application into a LangGraph workflow with specialized agents, typed state, conditional stop paths, tool calls, error recovery, and human approval. Add a practice lab with a fictional participant, evidence agent, facilitator coach, victim-services reviewer, and evaluator.

## Safety and privacy iteration

> Block identifying data before provider calls. Prevent guilt, credibility, remorse, diagnosis, risk, eligibility, or compulsory-participation decisions. Require citations, independent safety review, abstention, and metadata-only observability.

## AI technology-depth iteration

> Use existing Fireworks, Pinecone, LangSmith, You.com, Mistral, Deepgram, Neo4j, and Cloudflare credentials only where each provider has a distinct role. Add GraphRAG, cross-provider safety review, voice, public-source freshness research, abuse controls, and evaluation traces.

## Rubric-completion iteration

> Compare the project against Week 1–3 handouts and close the remaining gaps: measurable RAG targets, retrieval evaluation, vector/hybrid/graph comparison, provider-backed claim faithfulness, durable LangGraph interrupt/resume, signed reviewer sessions, tool-failure tests, course evidence, and submission documentation.

## Important changes made after evaluation

- Replaced generic retrieval with Pinecone + BM25 + reciprocal-rank fusion.
- Added reranking after observing that retrieval relevance alone was not a release decision.
- Added deterministic citation validation because schema-constrained generation can still cite the wrong ID.
- Added Mistral as an independent reviewer rather than using the generating provider to judge itself exclusively.
- Kept You.com results in a curator-only lane because web freshness is not the same as approved policy evidence.
- Added Neo4j only for explicit safeguard and jurisdiction relationships, with an ablation test to measure its value.
- Replaced a metadata-only approval simulation with a real D1-backed LangGraph interrupt and resume.
- Removed narratives, vectors, evidence excerpts, and generated briefs from persisted checkpoints.
- Added signed, expiring approval tokens and duplicate-decision protection.
- Split safety, retrieval, faithfulness, abstention, latency, and human-handoff evidence into separate metrics.
