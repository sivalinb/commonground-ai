# Evaluation Methodology

## Purpose

CommonGround AI separates deterministic safeguards, retrieval quality, provider-backed behavior, and human review. A single aggregate score would hide important failure modes.

## Release targets

| Metric                                        |     Target | Meaning                                                                         |
| --------------------------------------------- | ---------: | ------------------------------------------------------------------------------- |
| Recall@5                                      |       ≥85% | At least one expected source appears in the first five retrieved/cited sources  |
| Mean Reciprocal Rank                          |       ≥75% | Relevant evidence appears near the top of the ranking                           |
| Citation precision                            |       ≥95% | Independent review finds cited claims supported by their supplied excerpts      |
| Claim faithfulness                            |       ≥90% | Independent Mistral judge finds generated claims supported by supplied excerpts |
| Correct abstention                            |       ≥90% | Out-of-corpus or prohibited requests are withheld                               |
| P95 latency                                   | ≤15,000 ms | Ninety-five percent of evaluated workflows complete within the ceiling          |
| Critical privacy and prohibited-request rules |       100% | No regression is accepted for deterministic critical gates                      |

## Datasets

### `rj-safety-v4`

Forty-eight synthetic, de-identified cases covering privacy identifiers, coercion, consequential judgments, prompt injection, counterfactual fairness, missing evidence, and correct human handoff.

### `rj-retrieval-v1`

Twenty-four questions covering direct retrieval, exact-source lookup, multi-document reasoning, Colorado jurisdiction, victim autonomy, trauma-informed services, youth digital harm, reporting, multi-hop safeguards, and out-of-corpus abstention.

## Evaluation modes

### Deterministic preflight

Runs in GitHub Actions without provider credentials. It validates privacy and prohibited-request rules, BM25 source coverage, contracts, citation IDs, signed reviewer tokens, checkpoint redaction, and retry behavior.

### Provider-backed experiment

Runs through the protected production evaluation channel. It exercises Fireworks embeddings, Pinecone, BM25, Neo4j, Fireworks reranking and generation, Fireworks safety review, Mistral safety review, LangGraph handoff, and LangSmith metadata traces. A separate Mistral call judges claim-to-evidence faithfulness.

### Retrieval ablation

Ten shared questions run through:

1. Vector-only retrieval
2. Vector + BM25 hybrid retrieval
3. Hybrid retrieval + Neo4j GraphRAG

Recall@5, mean reciprocal rank, and task success are compared using identical expected-source labels.

## Latest measured result

The September 1, 2026 production run passed 24/24 tasks and all release thresholds.

| Metric               | Result |   Target |
| -------------------- | -----: | -------: |
| Recall@5             |  94.2% |     ≥85% |
| Mean reciprocal rank |  94.2% |     ≥75% |
| Citation precision   |    97% |     ≥95% |
| Claim faithfulness   |   100% |     ≥90% |
| Correct abstention   |   100% |     ≥90% |
| P95 latency          | 7.93 s | ≤15.00 s |

The 10-query ablation produced 100% Recall@5, MRR, and task success for GraphRAG. Vector-only and hybrid modes each produced 70% on those three measures. Results apply to the checked-in synthetic dataset and current corpus/model versions; they do not establish real-world agency effectiveness.

## Failure analysis

Every failed case records its expected outcome, actual outcome, retrieval mode, retrieved evidence IDs, ranking scores, faithfulness score, and latency. Failures are grouped into retrieval miss, ranking miss, unsupported generation, incorrect abstention, safety disagreement, provider failure, or latency regression.

## Privacy

Evaluation data is synthetic. LangSmith receives counts, scores, versions, durations, provider stages, and status—not raw case narratives, retrieved excerpts, or generated briefs.

## Reproduction

- `pnpm eval` runs the deterministic 48-case safety suite.
- `pnpm eval:retrieval` runs deterministic retrieval preflight.
- `pnpm eval:live` runs the provider-backed safety suite against an authorized environment.
- `pnpm eval:retrieval:live` runs provider-backed retrieval, faithfulness judging, and the 10-query ablation.
