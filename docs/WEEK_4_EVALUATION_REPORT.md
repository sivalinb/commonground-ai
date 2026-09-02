# CommonGround AI — Agent Evaluation and Improvement Report

Generated: 2026-09-02T16:13:09.734Z

## Evaluation contract

I measured safe task completion, claim faithfulness, Recall@5, autonomy-preserving human handoff, trajectory correctness, latency, tokens, and estimated cost on the CommonGround Guidance Agent. Both configurations used the same versioned 40-case dataset covering happy paths, edge cases, known failures, and adversarial inputs. Code-based checks, an independent Mistral LLM judge, trajectory evaluation, and manually specified reference labels were combined. Critical privacy, coercion, and prohibited-decision failures have a zero-tolerance release gate.

## Dataset

- LangSmith dataset: [commonground-rj-week4-v1](https://smith.langchain.com/o/3ea83d8b-5b31-4ce2-b4d7-f3e19cb10131/datasets/7eca2593-ec79-4f3b-811b-0c1af24721fd)
- Version: 1.0.0
- Provenance: synthetic, de-identified, zero real case narratives
- Distribution: 20 happy path, 12 edge, 6 known failure, 2 adversarial
- Labels: expected disposition, expected sources, critical flag, scenario tags, manually specified rationale, autonomy/trauma/handoff references

### Golden-corpus expansion

- LangSmith dataset: [commonground-rj-week4-200-v2](https://smith.langchain.com/o/3ea83d8b-5b31-4ce2-b4d7-f3e19cb10131/datasets/c62c1460-3673-447a-8eba-454628212369)
- Version strategy: immutable dataset name plus `2.0.0` metadata
- Verified examples: 200
- Distribution: 100 happy path, 60 edge, 30 known failure, 10 adversarial
- Cohorts: 40 provider-tested benchmark-core cases and 160 golden-extension cases
- Reference outcomes: 139 answer, 28 abstain, 20 refuse, 13 privacy block; 87 critical cases
- Validation: exact distribution, unique IDs and narratives, known source IDs, required labels, and deterministic privacy/refusal activation

The numeric baseline-versus-improved results below remain scoped to the 40-case provider-tested core. The full 200-case provider experiment has not been run and is not implied by these results.

## Baseline versus improved

| Metric                          |     Baseline |     Improved |         Delta |
| ------------------------------- | -----------: | -----------: | ------------: |
| Safe task completion            |          95% |         100% |           +5% |
| Critical guardrail compliance   |        85.7% |         100% |        +14.3% |
| Recall@5                        |        96.6% |         100% |         +3.4% |
| Full expected-source coverage@5 |          75% |        95.4% |        +20.4% |
| Citation validity               |         100% |         100% |            0% |
| Claim faithfulness              |        99.8% |         100% |         +0.2% |
| Autonomy preservation           |         100% |         100% |            0% |
| Trauma-aware quality            |        99.9% |         100% |         +0.1% |
| Human handoff appropriateness   |          95% |         100% |           +5% |
| Trajectory correctness          |          95% |         100% |           +5% |
| P95 latency                     |      9273 ms |      7968 ms |      -1305 ms |
| Average tokens/run              |         1746 |         2067 |          +321 |
| Estimated cost/run              | 0.001554 USD | 0.001845 USD | +0.000291 USD |

Release gate: **PASS**. A measured miss is retained as evidence and is not converted into a claimed success.

## Configuration under test

Baseline: Pinecone + BM25 hybrid retrieval, five candidates, top-three reranking, baseline prompt, no graph expansion.

Improved: Pinecone + BM25 + Neo4j GraphRAG, eight candidates, top-five reranking, GraphRAG-aware evidence confidence, explicit unsupported-request abstention, autonomy-focused prompt examples, and stronger provider retry recovery.

## Targeted improvements

1. **Hybrid retrieval plus Neo4j graph expansion.** — Neo4j safeguard relationships recover multi-hop evidence missed by shallow hybrid retrieval. Measured with: recallAt5, safeTaskCompletion.
2. **Candidate pool increased from five to eight.** — A larger candidate pool reduces ranking misses on mixed-jurisdiction and youth-safety cases. Measured with: recallAt5.
3. **Fireworks rerank top-N increased from three to five.** — Reranking five passages instead of three improves evidence coverage without uncited claims. Measured with: recallAt5, citationValidity, p95LatencyMs.
4. **Prompt v6 adds no-contact, changing-mind, youth-safety, and uncertainty examples.** — Explicit examples improve autonomy, trauma-aware language, and safe human handoff. Measured with: autonomyPreservation, traumaAwareQuality, handoffAppropriateness.

## Dominant failure clusters

- No post-improvement failures were observed in this run.

## LangSmith evidence

- Baseline experiment: commonground-week4-baseline-70874e99
- Improved experiment: commonground-week4-improved-0362bbf3
- Every provider-backed case includes case ID, dataset version, expected disposition, experiment name, prompt/corpus versions, stage hierarchy, latency, token count, output disposition, and evaluator feedback.
- Production traces remain metadata-only. Synthetic LangSmith dataset examples contain the fictional test prompt and reference output so experiments are reproducible.

## Monitoring plan

- safe_task_completion: alert below 95.
- critical_guardrail_compliance: alert below 100.
- claim_faithfulness: alert below 95.
- retrieval_recall_at_5: alert below 90.
- p95_latency_ms: alert above 12000.
- average_estimated_cost_usd: alert above 0.01.
- provider_or_tool_failure_rate: alert above 2.

## Honest limitations

- Synthetic evaluation data does not establish real-world agency effectiveness.
- Manually specified reference labels define expected behavior; agency deployment still requires independent multi-reviewer output calibration.
- Cost uses configurable blended token rates and excludes free-tier allowances and infrastructure overhead.

## Reproduction

`pnpm eval:week4` validates the 40-case experiment core. `pnpm eval:week4:dataset` validates the 200-case v2 corpus without credentials. `pnpm eval:week4:dataset:sync` verifies it in LangSmith. `pnpm eval:week4:live` runs the controlled provider experiment through an authorized HTTP environment. `pnpm eval:week4:direct` runs the provider-backed 40-case pipeline directly and publishes its experiments to LangSmith.
