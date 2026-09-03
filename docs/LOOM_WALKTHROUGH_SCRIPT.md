# CommonGround AI — Week 4 evaluation walkthrough

Target length: 8–10 minutes. Week 4 evaluation evidence should occupy at least 80% of the recording. Use only synthetic scenarios and public-source evidence. Do not show API keys, real narratives, D1 records, browser history, or operational information.

## Open these tabs before recording

1. [CommonGround evaluation laboratory](https://commonground-rj-ai.siva-babu.chatgpt.site/#evals)
2. [Versioned 200-case LangSmith dataset](https://smith.langchain.com/o/3ea83d8b-5b31-4ce2-b4d7-f3e19cb10131/datasets/c62c1460-3673-447a-8eba-454628212369)
3. [Direct LangSmith case trace](https://smith.langchain.com/o/3ea83d8b-5b31-4ce2-b4d7-f3e19cb10131/projects/p/3679e122-955c-478a-8f0f-dddab5ee1fd6/r/6f7c64af-3281-4397-8974-c3fb0fccd16a?poll=true)
4. [Full 200-case evaluation report](https://github.com/sivalinb/commonground-ai/blob/main/docs/FULL_CORPUS_EVALUATION_REPORT.md)
5. [Per-improvement ablation report](https://github.com/sivalinb/commonground-ai/blob/main/docs/WEEK_4_ABLATION_REPORT.md)
6. [Blinded human-review worksheet](https://github.com/sivalinb/commonground-ai/blob/main/evals/human-calibration-sample-v1.csv)

In LangSmith, open the 200-case dataset first. Also keep the historical 40-case dataset available if the dashboard exposes its completed baseline and improved experiments: `commonground-week4-baseline-70874e99` and `commonground-week4-improved-0362bbf3`.

## 0:00–0:35 — evaluation one-liner

> I measure five primary outcomes—safe task completion, critical guardrail compliance, Recall@5, claim faithfulness, and autonomy-preserving handoff—on the CommonGround Guidance Agent using a versioned 200-case golden dataset covering happy paths, edge cases, known failures, and adversarial inputs. I pair those quality measures with P95 latency, token usage, and estimated cost. Deterministic code evaluators score all 400 baseline and improved workflows, and an independent Mistral LLM-as-judge scores every answer output. Release requires zero critical-safety failures and every predeclared numeric threshold.

State the user outcome: a practitioner receives grounded, victim-centered training guidance, or the system safely refuses, abstains, or hands off when automation is inappropriate.

## 0:35–1:30 — Phase 1: metrics and golden dataset

Open the public evaluation laboratory and then the LangSmith dataset dashboard.

- Show the immutable dataset name `commonground-rj-week4-200-v2` and version `2.0.0`.
- Show the 200 examples and the 100 happy-path, 60 edge, 30 known-failure, and 10 adversarial distribution.
- Explain that every case has a unique synthetic narrative, expected disposition, expected sources, critical flag, scenario tags, rationale, and autonomy, trauma, and handoff labels.
- Point out that 200 cases exceed the handout's 30–50 minimum and 50–100 suggested range.
- Name the five primary metrics, then identify latency, tokens, and cost as operational constraints. This directly satisfies the handout's request for 3–5 outcome-linked metrics without hiding the additional diagnostics.
- Name the evaluator mix: exact/code-based, LLM-as-judge, trajectory evaluation, and independent human calibration.
- Show the numeric pass bars. Emphasize that quality is paired with latency, token, and cost measures.

## 1:30–2:55 — Phase 2: LangSmith instrumentation and trace proof

Open the direct LangSmith case trace for `w4-failure-03`.

1. Show the root run and case-linked metadata: case ID, dataset version, experiment name, prompt version, expected disposition, predicted disposition, token usage, latency, and evaluator status.
2. Expand the child runs and point to policy gate, embedding, hybrid retrieval, Neo4j graph expansion, reranking, generation, citation gate, Fireworks safety review, and Mistral cross-model review.
3. Show the code-evaluator feedback for safe task completion and trace completeness.
4. Explain the privacy boundary: synthetic evaluation traces may contain the fictional prompt and reference; production traces remain metadata-only.
5. In the dataset dashboard, open the Experiments or Comparison area. Show the completed historical 40-case baseline and improved experiments if visible.

Be precise about the current LangSmith capacity constraint: the 200-case dataset and direct trace are published, while new full 200-case pointwise, pairwise, and annotation-queue persistence returned HTTP 429 because the workspace exhausted its monthly unique-trace allowance. The complete 400-run provider and judge evidence is still checked into the repository. Do not claim the blocked LangSmith experiments were published.

## 2:55–4:15 — Phase 3: baseline and failure analysis

Return to the public evaluation laboratory and open the full report when useful.

- Baseline safe task completion: 97%.
- Baseline critical guardrail compliance: 96.6%.
- Baseline Recall@5: 95%.
- Baseline complete expected-source coverage@5: 72.7%.
- Baseline Mistral handoff appropriateness: 91.4%.
- Baseline P95 latency: 34.725 seconds.
- Baseline average tokens/run: 1,603; estimated cost/run: $0.001425.

Explain how aggregate metrics link back to case IDs and trace IDs. Show the dominant failure clusters and their estimated failed-run cost. Say that clustering came before changes, so improvements target a measurable root cause rather than a visually appealing feature.

## 4:15–5:30 — Phase 4: targeted improvements and measured deltas

Show the four tested changes:

1. Neo4j safeguard and jurisdiction graph expansion.
2. Candidate pool increased from five to eight.
3. Fireworks rerank depth increased from three to five.
4. Prompt v6 with explicit autonomy, no-contact, changing-mind, youth-safety, and uncertainty examples.

Then show the same-dataset result:

- Critical guardrails: 96.6% → 100%.
- Recall@5: 95% → 100%.
- Expected-source coverage@5: 72.7% → 88.6%.
- Mistral handoff appropriateness: 91.4% → 94.4%.
- P95 latency: 34.725 s → 7.5 s.
- Average tokens/run: 1,603 → 1,358.
- Estimated cost/run: $0.001425 → $0.001206.
- Safe task completion: 97% → 95.5%, a negative delta that remains visible.

Explain the reconciled evaluation count: 400 provider workflows produced 269 answer outputs—139 baseline and 130 improved—because the improved model self-abstained on nine cases whose expected disposition was answer.

## 5:30–6:45 — ablation and nine-regression root cause

Open the ablation report and emphasize that each middle experiment changes only one lever.

- Fixed cohort: the 40-case benchmark core plus all nine regression cases.
- Rerank-depth-only achieved 100% Recall@5 and 97.1% expected-source coverage@5.
- Prompt-only preserved 100% critical guardrails and raised Mistral handoff appropriateness to 98.6% on the cohort.
- All nine combined-candidate regressions were model-generated abstentions after retrieval, not confidence-gate stops.
- One regression reproduced with the prompt-only lever; eight appeared only when the prompt and expanded/reranked context were combined.

State the practical next change: revise the generation instruction and add a post-generation check that distinguishes legitimate unsupported-question abstention from an answerable question with strong approved evidence, then rerun the frozen dataset.

## 6:45–7:35 — LLM-as-judge and human calibration

Show the three-layer evaluator panel.

- Code evaluators: disposition, schema, PII, citations, retrieval, trajectory, latency, tokens, cost, and provider health.
- Mistral judge: faithfulness, autonomy, trauma-aware quality, overall restorative-justice quality, handoff appropriateness, and critical failure.
- Human review: a blinded 30-case stratified worksheet using the same five anchored 0–4 dimensions.

Open the worksheet briefly. State the acceptance targets: at least 85% overall human/judge agreement, 100% agreement on critical cases, and zero false-safe decisions. State the current completion honestly: 0/30 until a qualified human reviewer completes the packet. An AI-generated score is not substituted for human calibration.

## 7:35–8:20 — release decision and production monitoring

Show the release badge and monitoring contract.

- Zero critical-safety-veto failures: pass.
- Fifteen of sixteen numeric thresholds: pass.
- LLM handoff appropriateness: 94.4% against the 95% target.
- Final decision: **not yet passed**.

Explain that the 99.4% weighted explanatory score cannot override a missed predeclared gate. Show monitoring signals for safe completion, critical guardrails, PII, faithfulness, Recall@5, latency, cost, and provider/tool failure rate.

## 8:20–8:50 — close

> CommonGround is not just a polished agent demo. It has a versioned golden dataset, multiple evaluator types, case-level LangSmith trace evidence, a frozen baseline, measured improvements, failure clusters, one-change-at-a-time ablations, an honest release gate, and a production monitoring contract. The remaining work—LangSmith capacity renewal and independent 30-case human calibration—is disclosed rather than hidden.

Restate that the system is training-only and does not determine guilt, credibility, remorse, diagnosis, risk, eligibility, or compulsory participation.

## Week 4 evidence checklist

| Handout requirement | Evidence to show |
| --- | --- |
| Evaluation one-liner | Opening statement with agent, metric set, 200 cases, judge mix, and pass bars |
| 3–5 outcome-linked metrics plus cost/latency | Evaluation laboratory metric cards and release thresholds |
| 30–50 labeled cases with required scenario mix | Versioned 200-case LangSmith dataset with 100/60/30/10 distribution |
| One trace per case with LLM/tool child runs | Direct `w4-failure-03` LangSmith trace with nine child runs |
| Required trace metadata | Case, dataset, experiment, prompt, expected/predicted, tokens, latency, and feedback |
| Baseline run | Frozen baseline metrics and historical LangSmith experiment |
| Failure clusters and rough cost | Full report and post-improvement failure analysis |
| Three-to-four targeted improvements | Four configuration changes with explicit hypotheses |
| Post-improvement rerun and delta | Same-dataset metric comparison over 400 workflows |
| What worked and what did not | Per-improvement ablation plus nine-regression analysis |
| LLM-as-judge | Mistral evaluator dimensions, reason codes, and critical-failure veto |
| Human calibration | Blinded 30-case packet, agreement targets, and truthful 0/30 status |
| Production monitoring | Quality, safety, cost, latency, and provider-failure alerts |
| Loom submission | This narrated walkthrough and final share link |

## Recording checklist

- Use the public site as the main presentation surface.
- Spend at least 80% of the recording on evaluation evidence.
- Show the LangSmith dataset dashboard and direct trace, not just screenshots.
- Expand at least three child runs and show evaluation metadata.
- Show baseline, improved, delta, and the failed handoff threshold.
- Show ablation evidence and explain the nine regressions.
- State the 400/269 reconciliation explicitly.
- State human calibration as 0/30 until completed.
- State the LangSmith HTTP 429 limitation without implying missing local evaluation.
- Keep captions enabled.
- Do not expose keys, real cases, private browser tabs, or sensitive records.
- Copy the final Loom link into the README and evaluation report only after the recording exists.
