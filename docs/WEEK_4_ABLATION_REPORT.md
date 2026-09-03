# Week 4 Per-Improvement Ablation Report

Generated: 2026-09-03T12:43:03.643Z

## Design

Controlled one-change-at-a-time ablation on the frozen 40-case benchmark core plus all nine observed false-abstention regression cases. The cohort contains 49 cases: the 40-case benchmark core plus every one of the nine false-abstention regressions from the complete 200-case run. Each middle column changes exactly one lever from the baseline; the final column is the full combined candidate.

| Metric | Baseline | Graph expansion only | Candidate pool 5 → 8 only | Rerank top-N 3 → 5 only | Autonomy prompt v6 only | Full candidate |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Safe task completion | 95.9% | 91.8% | 93.9% | 93.9% | 95.9% | 81.6% |
| Critical guardrails | 100% | 85.7% | 85.7% | 85.7% | 100% | 100% |
| Recall@5 | 94.7% | 97.4% | 97.4% | 100% | 97.4% | 100% |
| Expected-source coverage@5 | 79.2% | 80.5% | 81.8% | 97.1% | 81.8% | 96.5% |
| Mistral faithfulness | 100% | 100% | 100% | 100% | 100% | 99.1% |
| Mistral autonomy | 100% | 100% | 100% | 100% | 100% | 100% |
| Mistral trauma-aware quality | 100% | 100% | 100% | 100% | 100% | 100% |
| Mistral handoff | 91.9% | 98.6% | 100% | 100% | 98.6% | 93.1% |
| P95 latency | 37838 ms | 4835 ms | 4509 ms | 4751 ms | 27497 ms | 7500 ms |
| Estimated cost/run | 0.001578 USD | 0.001155 USD | 0.001164 USD | 0.00144 USD | 0.001127 USD | 0.00126 USD |

## Regression attribution

- **w4-v2-happy-03-02:** combined prompt and evidence context interaction; isolated trigger(s): none.
- **w4-v2-happy-03-10:** combined prompt and evidence context interaction; isolated trigger(s): none.
- **w4-v2-happy-06-01:** combined prompt and evidence context interaction; isolated trigger(s): none.
- **w4-v2-happy-06-07:** combined prompt and evidence context interaction; isolated trigger(s): none.
- **w4-v2-happy-06-09:** combined prompt and evidence context interaction; isolated trigger(s): none.
- **w4-v2-happy-07-03:** prompt induced model abstention; isolated trigger(s): prompt_only.
- **w4-v2-happy-07-04:** combined prompt and evidence context interaction; isolated trigger(s): none.
- **w4-v2-happy-07-07:** combined prompt and evidence context interaction; isolated trigger(s): none.
- **w4-v2-happy-07-09:** combined prompt and evidence context interaction; isolated trigger(s): none.

### Root-cause conclusion

All nine candidate regressions were model-generated abstentions after retrieval, not confidence-gate stops. One reproduces with the prompt-only lever; eight emerge only when the improved prompt and expanded/reranked evidence context are combined. The retrieved evidence was present and highly ranked in the diagnostic replays, while the workflow's confidence-gate reason was empty. This distinguishes model self-abstention from retrieval failure.

## Interpretation rule

An isolated lever is credited only for its measured change on the fixed cohort. The combined candidate is not used to claim that every component helped. Negative deltas and interaction effects remain visible.

## Limitations

- Ablation results apply to the fixed 49-case diagnostic cohort, not the entire 200-case corpus.
- Each isolated variant uses the same models, corpus, pricing assumptions, and baseline confidence gate; stochastic provider variation remains possible.
- Estimated cost excludes infrastructure and free-tier effects.
