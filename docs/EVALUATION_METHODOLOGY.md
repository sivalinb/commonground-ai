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

### `commonground-rj-week4-v1`

Forty end-to-end cases stored in the repository and as a versioned LangSmith dataset: 20 happy paths, 12 edge cases, six known failures, and two adversarial cases. Each case has an expected disposition, expected source IDs, critical-safety flag, scenario tags, reference rationale, and autonomy/trauma/handoff labels. The dataset is synthetic and de-identified; it contains no operational case information.

The primary experiment evaluates the CommonGround Guidance Agent, not the entire website. Its user outcome is a safe, cited, autonomy-preserving practice brief—or a correct privacy block, refusal, abstention, or human handoff.

### `commonground-rj-week4-200-v2`

Two hundred synthetic, de-identified, uniquely identified end-to-end cases stored in the repository and LangSmith: 100 happy paths, 60 edge cases, 30 known failures, and 10 adversarial cases. The immutable v2 corpus contains the 40-case provider-tested core and a 160-case coverage extension. It has 139 answer, 28 abstention, 20 refusal, and 13 privacy-block reference outcomes; 87 cases are marked critical. CI verifies exact distribution, uniqueness, required labels, source-ID integrity, and activation of privacy/refusal rules.

Reference outcomes are manually specified and human-readable. They have not yet completed independent multi-reviewer calibration, so the 200-case dataset is a reproducible golden corpus for development—not evidence of agency approval or field effectiveness.

## Evaluation modes

### Deterministic preflight

Runs in GitHub Actions without provider credentials. It includes 31 deterministic unit tests and validates privacy and prohibited-request rules, BM25 source coverage, contracts, citation IDs, signed reviewer tokens, checkpoint redaction, retry behavior, and the 48-case safety suite.

### Provider-backed experiment

Runs through the protected production evaluation channel. It exercises Fireworks embeddings, Pinecone, BM25, Neo4j, Fireworks reranking and generation, Fireworks safety review, Mistral safety review, LangGraph handoff, and LangSmith metadata traces. A separate Mistral call judges claim-to-evidence faithfulness.

### Retrieval ablation

Ten shared questions run through:

1. Vector-only retrieval
2. Vector + BM25 hybrid retrieval
3. Hybrid retrieval + Neo4j GraphRAG

Recall@5, mean reciprocal rank, and task success are compared using identical expected-source labels.

### End-to-end baseline and improvement experiment

The current provider-backed Week 4 runner evaluates the same 40-case benchmark core twice:

1. Frozen baseline: Pinecone + BM25 hybrid retrieval, five candidates, top-three reranking, no graph expansion, baseline prompt.
2. Improved: Neo4j GraphRAG expansion, eight candidates, top-five reranking, GraphRAG-aware confidence, unsupported-request abstention, autonomy-focused prompt examples, and stronger provider retries.

Code evaluators score disposition, citation structure, retrieval, critical guardrails, trajectory, and human-handoff state. Mistral independently scores faithfulness, autonomy preservation, trauma-aware quality, and handoff appropriateness. Manually specified reference outcomes provide expected behavior and rationale. The independent human calibration procedure is documented separately and must be completed before any agency-use claim.

## Latest measured result

The September 1, 2026 production run passed 24/24 tasks and all release thresholds.

The corresponding repository quality workflow also passed type checking, linting, all 31 deterministic unit tests, the 48-case deterministic safety evaluation, and the production build.

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

The Week 4 report additionally records a representative LangSmith trace ID and estimated wasted provider cost for each of the three largest failure clusters. Configuration failures and provider throttling remain visible as operational evidence rather than being relabeled as model-quality failures.

## Privacy

Evaluation data is synthetic. LangSmith receives counts, scores, versions, durations, provider stages, and status—not raw case narratives, retrieved excerpts, or generated briefs.

## Reproduction

- `pnpm eval` runs the deterministic 48-case safety suite.
- `pnpm eval:retrieval` runs deterministic retrieval preflight.
- `pnpm eval:live` runs the provider-backed safety suite against an authorized environment.
- `pnpm eval:retrieval:live` runs provider-backed retrieval, faithfulness judging, and the 10-query ablation.
- `pnpm eval:week4` validates the 40-case dataset, labels, and exact scenario distribution without credentials.
- `pnpm eval:week4:dataset` validates all 200 v2 cases, source IDs, safety triggers, labels, uniqueness, cohorts, and exact distribution without credentials.
- `pnpm eval:week4:dataset:sync` creates or verifies the immutable v2 dataset in LangSmith when `LANGSMITH_API_KEY` is configured.
- `pnpm eval:week4:live` runs both configurations through an authorized HTTP deployment.
- `pnpm eval:week4:direct` runs the provider-backed workflow directly, uploads/version-controls the LangSmith dataset, creates baseline and improved experiments, and regenerates the JSON and Markdown reports.
