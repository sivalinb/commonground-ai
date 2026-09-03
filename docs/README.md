# CommonGround AI documentation

This index is the shortest path through the project. It distinguishes current evidence from historical snapshots and keeps implementation, evaluation, and operational material easy to verify.

## Start here

- **First-time reader:** read the [root README](../README.md), then try the [public application](https://commonground-rj-ai.siva-babu.chatgpt.site).
- **Project reviewer:** follow the five-step evidence path below.
- **Engineer:** use the [cumulative implementation report](WEEK_1_3_PROJECT_REPORT.md), root setup instructions, and production-readiness documents.
- **Restorative-justice or victim-services reviewer:** use the [independent review guide](WEEK_4_REVIEWER_GUIDE.md) and [blinded worksheet](../evals/human-calibration-sample-v1.csv).

## Current status at a glance

- Golden dataset: **200 synthetic cases** — 100 happy paths, 60 edge cases, 30 known failures, and 10 adversarial cases.
- Experiment volume: **400 provider-backed workflows** — 200 baseline and 200 improved.
- Independent model review: **269/269 answer outputs** judged by Mistral — 139 baseline and 130 improved.
- Current candidate: **not yet passed** — zero critical-safety-veto failures and 15/16 numeric thresholds passed.
- Remaining numeric miss: **94.4% handoff appropriateness** against a predeclared **95%** target.
- Human calibration: **0/30**, pending a qualified independent reviewer; no human-agreement claim is made.

## Five-step reviewer evidence path

1. Read the [evaluation methodology](EVALUATION_METHODOLOGY.md) for metrics, datasets, evaluator contracts, privacy boundaries, and reproduction commands.
2. Inspect the [current full-corpus report](FULL_CORPUS_EVALUATION_REPORT.md) for the frozen baseline, improved results, failure clusters, cost, and release decision.
3. Verify the [one-change-at-a-time ablation](WEEK_4_ABLATION_REPORT.md), including attribution of the nine new abstentions.
4. Open the [versioned LangSmith dataset](https://smith.langchain.com/o/3ea83d8b-5b31-4ce2-b4d7-f3e19cb10131/datasets/c62c1460-3673-447a-8eba-454628212369) and [direct case-level trace](https://smith.langchain.com/o/3ea83d8b-5b31-4ce2-b4d7-f3e19cb10131/projects/p/3679e122-955c-478a-8f0f-dddab5ee1fd6/r/6f7c64af-3281-4397-8974-c3fb0fccd16a?poll=true).
5. Review the [human-calibration procedure](WEEK_4_REVIEWER_GUIDE.md) and the current [0/30 status report](HUMAN_CALIBRATION_REPORT.md).

## Sources of truth

| Question | Current source |
| --- | --- |
| What is the system and why does it exist? | [Root README](../README.md) and [reviewer-friendly Google Doc](https://docs.google.com/document/d/1ljztlw9UGJ5nFPxkM02W1-dk_WQldZh6XMlJLtcOhq8/edit) |
| What are the current 200-case results? | [Full-corpus evaluation report](FULL_CORPUS_EVALUATION_REPORT.md) |
| How are metrics and evaluators defined? | [Evaluation methodology](EVALUATION_METHODOLOGY.md) and [evaluator contract](../data/evaluator-contract.json) |
| Which change caused which result? | [Per-improvement ablation report](WEEK_4_ABLATION_REPORT.md) |
| What remains for human review? | [Human review guide](WEEK_4_REVIEWER_GUIDE.md) and [calibration status](HUMAN_CALIBRATION_REPORT.md) |
| What is required before an agency pilot? | [Production readiness](PRODUCTION_READINESS.md), [data governance](DATA_GOVERNANCE.md), [incident response](INCIDENT_RESPONSE.md), and [accessibility status](ACCESSIBILITY_CONFORMANCE.md) |

## Document map

### Current evaluation evidence

- [`FULL_CORPUS_EVALUATION_REPORT.md`](FULL_CORPUS_EVALUATION_REPORT.md) — current 200-case baseline versus improved results and release decision.
- [`EVALUATION_METHODOLOGY.md`](EVALUATION_METHODOLOGY.md) — datasets, metrics, release targets, evaluator modes, privacy, and reproduction.
- [`WEEK_4_ABLATION_REPORT.md`](WEEK_4_ABLATION_REPORT.md) — 49-case controlled ablation and nine-regression root-cause analysis.
- [`WEEK_4_REVIEWER_GUIDE.md`](WEEK_4_REVIEWER_GUIDE.md) — independent human-review and agreement procedure.
- [`HUMAN_CALIBRATION_REPORT.md`](HUMAN_CALIBRATION_REPORT.md) — current human-calibration completion status.

### Historical evaluation evidence

- [`WEEK_4_EVALUATION_REPORT.md`](WEEK_4_EVALUATION_REPORT.md) — frozen earlier 40-case benchmark. It is retained for reproducibility and must not be interpreted as the current 200-case release result.

### Implementation and engineering history

- [`WEEK_1_3_PROJECT_REPORT.md`](WEEK_1_3_PROJECT_REPORT.md) — cumulative product, RAG, agentic-system, evaluation, and implementation narrative.
- [`PROMPTS_AND_ITERATIONS.md`](PROMPTS_AND_ITERATIONS.md) — AI-assisted development intent, major prompts, and changes made after evaluation.

### Operational readiness

- [`PRODUCTION_READINESS.md`](PRODUCTION_READINESS.md) — current classification, implemented safeguards, pilot gates, and rollout approach.
- [`DATA_GOVERNANCE.md`](DATA_GOVERNANCE.md) — data inventory and evidence lifecycle.
- [`INCIDENT_RESPONSE.md`](INCIDENT_RESPONSE.md) — containment, severity, recovery, and learning process.
- [`ACCESSIBILITY_CONFORMANCE.md`](ACCESSIBILITY_CONFORMANCE.md) — accessibility target, implemented controls, and required independent audit.

## Important interpretation notes

- The public application is a training and portfolio demonstration, not an operational justice or law-enforcement decision system.
- The historical 40-case report and the current 200-case report answer different reproducibility questions; use the full-corpus report for the current release decision.
- The weighted explanatory score does not override a failed predeclared release threshold.
- Cloudflare is supporting infrastructure for abuse prevention and minimized durable state, not an AI capability claim.
- Synthetic evaluation results do not establish real-world agency effectiveness.
