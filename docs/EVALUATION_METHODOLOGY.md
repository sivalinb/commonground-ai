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

Two hundred synthetic, de-identified, uniquely identified end-to-end cases stored in the repository and verified in LangSmith: 100 happy paths, 60 edge cases, 30 known failures, and 10 adversarial cases. The immutable v2 corpus contains the 40-case benchmark core and a 160-case coverage extension. It has 139 answer, 28 abstention, 20 refusal, and 13 privacy-block reference outcomes; 87 cases are marked critical. CI verifies exact distribution, uniqueness, required labels, source-ID integrity, and activation of privacy/refusal rules.

Reference outcomes are manually specified and human-readable. They have not yet completed independent multi-reviewer calibration, so the 200-case dataset is a reproducible golden corpus for development—not evidence of agency approval or field effectiveness.

## Evaluation modes

### Deterministic preflight

Runs in GitHub Actions without provider credentials. It includes 47 deterministic unit tests and validates privacy and prohibited-request rules, BM25 source coverage, contracts, citation IDs, signed reviewer tokens, checkpoint redaction, retry behavior, evaluator-governance artifacts, and the 48-case safety suite.

### Provider-backed experiment

Runs through the protected production evaluation channel. It can exercise Fireworks embeddings, Pinecone, BM25, Neo4j, Fireworks reranking and generation, Fireworks safety review, Mistral cross-provider safety review, LangGraph handoff, and LangSmith metadata traces. A separate Mistral call judges claim-to-evidence faithfulness. The completed full-corpus run retained the Fireworks primary safety critic and reserved Mistral for independent output judging because Mistral free-tier rate controls could not sustain two model-review calls per answer; this run-time choice is recorded in the report.

### Retrieval ablation

Ten shared questions run through:

1. Vector-only retrieval
2. Vector + BM25 hybrid retrieval
3. Hybrid retrieval + Neo4j GraphRAG

Recall@5, mean reciprocal rank, and task success are compared using identical expected-source labels.

### End-to-end baseline and improvement experiment

The current provider-backed runner evaluates the same 200-case golden corpus twice:

1. Frozen baseline: Pinecone + BM25 hybrid retrieval, five candidates, top-three reranking, no graph expansion, baseline prompt.
2. Improved: Neo4j GraphRAG expansion, eight candidates, top-five reranking, GraphRAG-aware confidence, unsupported-request abstention, autonomy-focused prompt examples, and stronger provider retries.

Code evaluators score exact disposition, critical guardrails, output schema, PII leakage, citation integrity, claim citation coverage, retrieval, trajectory, human handoff, latency, cost, and provider/tool health. A native asynchronous Mistral LangSmith evaluator independently scores faithfulness, autonomy preservation, trauma-aware quality, handoff appropriateness, and overall RJ quality on an anchored 0–4 scale. It also returns stable reason codes and a critical-failure decision. Manually specified reference outcomes provide expected behavior and rationale.

After the two pointwise experiments, a blinded Mistral pairwise evaluator can compare baseline and candidate outputs with randomized ordering. It measures safety, grounding, autonomy, trauma awareness, facilitator usefulness, and escalation quality. Pairwise preference complements the absolute gates; it never overrides a critical-safety failure. The evaluator is implemented, but the full pairwise result is pending renewed LangSmith trace capacity and is not included in the completed local-evidence report.

The improved experiment has a deterministic 30-case stratified worksheet ready for a LangSmith human annotation queue. Qualified RJ and victim-services reviewers score the same five dimensions before viewing automated results. The acceptance targets are at least 85% overall human/judge agreement, 100% agreement on critical cases, and zero false-safe decisions. Queue creation is pending renewed LangSmith trace capacity, and this calibration must be completed before any agency-use claim.

The release decision applies a critical-safety veto before calculating a weighted explanatory quality score. Any PII leak, critical guardrail miss, or LLM-judge critical failure blocks release regardless of the average score.

## Latest measured result

The complete 200-case experiment produced 400 provider-backed workflow results: 200 frozen-baseline and 200 improved runs. Deterministic code evaluators covered every result, and an independent Mistral judge scored all 268 answer outputs. The improved configuration passed every release threshold and the zero-tolerance critical-safety veto.

| Full-corpus metric                  |  Baseline |  Improved | Improved target |
| ----------------------------------- | --------: | --------: | --------------: |
| Safe task completion                |       97% |     95.5% |            ≥95% |
| Critical guardrail compliance       |     96.6% |      100% |            100% |
| Recall@5                            |       95% |      100% |            ≥90% |
| Complete expected-source coverage@5 |     72.7% |     88.6% |        reported |
| Claim faithfulness                  |     99.8% |     99.6% |            ≥90% |
| Autonomy preservation               |     99.8% |      100% |            ≥95% |
| Trauma-aware quality                |     99.8% |      100% |            ≥95% |
| LLM critical-safety pass            |      100% |      100% |            100% |
| P95 latency                         |   34.73 s |    7.50 s |        ≤15.00 s |
| Estimated cost per run              | $0.001425 | $0.001206 |      ≤$0.010000 |

The improved weighted explanatory score was 99.5%, but the score cannot override the critical-safety veto. Nine improved cases missed the exact expected handoff/disposition label; those misses remain visible even though the release thresholds passed. See [`FULL_CORPUS_EVALUATION_REPORT.md`](FULL_CORPUS_EVALUATION_REPORT.md) for the readable report and [`../data/week4-full-eval-report.json`](../data/week4-full-eval-report.json) for case-level evidence.

The versioned 200-case dataset is verified in LangSmith. Full pointwise trace persistence, pairwise results, and annotation-queue creation remain pending because the account's monthly trace allowance was exhausted. This operational limitation is kept separate from model-quality results.

### Earlier retrieval benchmark

The September 1, 2026 production run passed 24/24 tasks and all release thresholds.

The corresponding repository quality workflow also passed type checking, linting, all deterministic unit tests, the 48-case deterministic safety evaluation, and the production build.

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

The evaluation reports additionally record representative trace IDs when available and estimated wasted provider cost for the largest failure clusters. Configuration failures and provider throttling remain visible as operational evidence rather than being relabeled as model-quality failures.

## Privacy

Offline evaluation data is synthetic and de-identified, so LangSmith experiments may contain fictional prompts, generated outputs, references, and evidence needed for reproducible judging. Production traces remain metadata-only: LangSmith receives counts, scores, versions, durations, provider stages, and status—not operational case narratives, retrieved excerpts, or generated briefs. Text judging is restricted to synthetic or explicitly de-identified training interactions.

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
- `pnpm eval:week4:full:validate` validates the full 200-case corpus against the experiment runner's distribution and label contract.
- `pnpm eval:week4:full:local` runs or resumes all 200 cases through baseline and improved workflows, native code and Mistral judges, and the release veto, preserving a local checkpoint and case-level report.
- `pnpm eval:week4:full` runs the same full experiment and additionally publishes pointwise experiments, randomized pairwise comparison, and the human calibration queue to LangSmith when account capacity is available.
- `pnpm eval:week4:calibration:prepare` deterministically regenerates the 30-case blinded reviewer worksheet and calibration manifest.

## LangSmith implementation references

- [Evaluation types and evaluator approaches](https://docs.langchain.com/langsmith/evaluation-types)
- [LLM-as-a-Judge evaluators](https://docs.langchain.com/langsmith/llm-as-judge)
- [Code evaluators with the SDK](https://docs.langchain.com/langsmith/code-evaluator-sdk)
- [Pairwise evaluation](https://docs.langchain.com/langsmith/evaluate-pairwise)
- [Human annotation queues](https://docs.langchain.com/langsmith/annotation-queues)
