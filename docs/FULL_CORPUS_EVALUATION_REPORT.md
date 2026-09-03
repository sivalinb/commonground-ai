# CommonGround AI — Agent Evaluation and Improvement Report

Generated: 2026-09-03T12:43:46.313Z

## Evaluation contract

I measured safe task completion, claim faithfulness, Recall@5, autonomy-preserving human handoff, trajectory correctness, latency, tokens, and estimated cost on the CommonGround Guidance Agent. Both configurations used the same versioned 200-case dataset covering happy paths, edge cases, known failures, and adversarial inputs. Deterministic code checks, a native asynchronous Mistral LLM-as-Judge evaluator, trajectory evaluation, and manually specified reference labels were combined. The randomized pairwise evaluator is implemented but was not executed in this local-evidence run. Critical privacy, coercion, prohibited-decision, unsafe-judge, and PII failures have a zero-tolerance release veto.

## Dataset

- LangSmith dataset: commonground-rj-week4-200-v2
- Version: 2.0.0
- Provenance: synthetic, de-identified, zero real case narratives
- Distribution: 100 happy path, 60 edge, 30 known failure, 10 adversarial
- Labels: expected disposition, expected sources, critical flag, scenario tags, manually specified rationale, autonomy/trauma/handoff references

## Baseline versus improved

| Metric | Baseline | Improved | Delta |
| --- | ---: | ---: | ---: |
| Safe task completion | 97% | 95.5% | -1.5% |
| Critical guardrail compliance | 96.6% | 100% | +3.4% |
| Recall@5 | 95% | 100% | +5% |
| Full expected-source coverage@5 | 72.7% | 88.6% | +15.9% |
| Citation validity | 100% | 100% | 0% |
| Claim citation coverage | 100% | 100% | 0% |
| Output schema validity | 100% | 100% | 0% |
| PII leakage-free | 100% | 100% | 0% |
| Provider/tool success | 100% | 100% | 0% |
| Claim faithfulness | 99.8% | 99.6% | -0.2% |
| Autonomy preservation | 99.8% | 99.8% | 0% |
| Trauma-aware quality | 99.8% | 99.8% | 0% |
| Overall RJ quality | 99.6% | 99.8% | +0.2% |
| LLM handoff appropriateness | 91.4% | 94.4% | +3% |
| LLM critical-safety pass | 100% | 100% | 0% |
| Human handoff appropriateness | 97% | 95.5% | -1.5% |
| Trajectory correctness | 97% | 95.5% | -1.5% |
| P95 latency | 34725 ms | 7500 ms | -27225 ms |
| Average tokens/run | 1603 | 1358 | -245 |
| Estimated cost/run | 0.001425 USD | 0.001206 USD | -0.000219 USD |

Release gate: **NOT YET PASSED**. Critical-safety veto: **PASS**. Weighted explanatory quality score: **99.4%**. The weighted score never overrides the veto, and a measured miss is retained as evidence.

## Configuration under test

Baseline: Pinecone + BM25 hybrid retrieval, five candidates, top-three reranking, baseline prompt, no graph expansion.

Improved: Pinecone + BM25 + Neo4j GraphRAG, eight candidates, top-five reranking, GraphRAG-aware evidence confidence, explicit unsupported-request abstention, autonomy-focused prompt examples, and stronger provider retry recovery.

## Targeted improvements

1. **Hybrid retrieval plus Neo4j graph expansion.** — Neo4j safeguard relationships recover multi-hop evidence missed by shallow hybrid retrieval. Measured with: recallAt5, safeTaskCompletion.
2. **Candidate pool increased from five to eight.** — A larger candidate pool reduces ranking misses on mixed-jurisdiction and youth-safety cases. Measured with: recallAt5.
3. **Fireworks rerank top-N increased from three to five.** — Reranking five passages instead of three improves evidence coverage without uncited claims. Measured with: recallAt5, citationValidity, p95LatencyMs.
4. **Prompt v6 adds no-contact, changing-mind, youth-safety, and uncertainty examples.** — Explicit examples improve autonomy, trauma-aware language, and safe human handoff. Measured with: autonomyPreservation, traumaAwareQuality, handoffAppropriateness.

## Dominant failure clusters

- **false_abstention_model_decision**: 9 case(s), estimated failed-run cost $0.008627, trace IDs cg_eval_0f27d85e-5050-4df0-b3e6-93cec927e573, cg_eval_83934d1a-e7c0-48b6-847d-2172093b31de.

The controlled 49-case ablation found that all nine candidate regressions were model-generated abstentions after retrieval, not evidence-confidence-gate stops. One reproduced with the prompt-only lever; eight appeared only when the improved prompt and expanded/reranked evidence context were combined. See [the per-improvement ablation report](WEEK_4_ABLATION_REPORT.md).

## LangSmith evidence

- Baseline experiment: Run locally without LangSmith publication
- Improved experiment: Run locally without LangSmith publication
- Randomized pairwise experiment: Not published in this run
- Human calibration queue: Procedure ready; queue not created in this run
- Direct case trace: [w4-failure-03 with nine child runs and evaluator feedback](https://smith.langchain.com/o/3ea83d8b-5b31-4ce2-b4d7-f3e19cb10131/projects/p/3679e122-955c-478a-8f0f-dddab5ee1fd6/r/6f7c64af-3281-4397-8974-c3fb0fccd16a?poll=true)
- Every local provider-backed result includes case ID, dataset version, expected and actual disposition, profile, prompt version, latency, token count, retrieval IDs, trajectory score, and evaluator feedback.
- Provider workflows: 400; answer outputs: 269; independently judged answer outputs: 269.
- Production traces remain metadata-only. Synthetic LangSmith dataset examples contain the fictional test prompt and reference output so experiments are reproducible.

## Monitoring plan

- safe_task_completion: alert below 95.
- critical_guardrail_compliance: alert below 100.
- pii_leakage_free: alert below 100.
- output_schema_valid: alert below 100.
- claim_faithfulness: alert below 95.
- retrieval_recall_at_5: alert below 90.
- p95_latency_ms: alert above 15000.
- average_estimated_cost_usd: alert above 0.01.
- provider_or_tool_failure_rate: alert above 2.

## Honest limitations

- Synthetic evaluation data does not establish real-world agency effectiveness.
- Manually specified reference labels define expected behavior; agency deployment still requires independent multi-reviewer output calibration.
- Cost uses configurable blended token rates and excludes free-tier allowances and infrastructure overhead.
- This run preserved complete local provider and Mistral-judge evidence but did not persist experiment traces, pairwise results, or the human queue to LangSmith.

## Reproduction

`pnpm eval:week4` validates the 40-case core without credentials. `pnpm eval:week4:full:validate` validates the 200-case corpus with the same evaluator contract. `pnpm eval:week4:full:local` runs or resumes all 200 cases with checkpointed provider and native Mistral-judge evidence. `pnpm eval:week4:direct` publishes the provider-backed core to LangSmith. `pnpm eval:week4:full` publishes all 200 cases, pairwise comparison, and the human queue when LangSmith capacity is available.
