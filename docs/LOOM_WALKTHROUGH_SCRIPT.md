# CommonGround AI — walkthrough script

Target length: 7–9 minutes. Record only synthetic scenarios and public-source evidence. Do not show API keys, real narratives, or operational records.

## 0:00–0:45 — problem and audience

CommonGround AI is a training and decision-support workspace for restorative-justice facilitators, victim-services practitioners, and public-safety partners. The problem is not a shortage of generic chatbot answers. It is the need for grounded, autonomy-preserving practice guidance with explicit abstention, human review, and measurable safety controls. The product does not decide eligibility, diagnose a person, predict behavior, or replace a trained practitioner.

## 0:45–2:30 — end-to-end synthetic workflow

1. Open the guided scenario workspace.
2. Select a fictional scenario and show the training-only acknowledgement.
3. Run the analysis.
4. Point out the structured finding, options, safeguards, confidence, citations, and human-approval state.
5. Open one public source and explain that the claim-to-citation contract is checked before the output can advance.
6. Approve the synthetic brief to demonstrate the LangGraph interrupt/resume checkpoint.

## 2:30–3:40 — AI architecture

Show the architecture view and follow one request through privacy and prohibited-request gates, Fireworks embeddings, Pinecone plus BM25 hybrid retrieval, Neo4j safeguard expansion, Fireworks reranking and structured generation, Fireworks safety review, Mistral cross-model review, citation validation, and the human checkpoint. Explain that LangSmith receives full text only for synthetic evaluation cases; production traces are metadata-only.

## 3:40–5:15 — LangSmith evidence

Open the direct case-level trace link. Show the root inputs, reference outcome, predicted disposition, correctness, prompt and dataset versions, token usage, evaluator metadata, and child spans for policy, embedding, retrieval, graph expansion, reranking, generation, citation checking, and safety review. Then open the baseline and improved experiment links and show that both use the same immutable 200-case dataset.

## 5:15–6:45 — evaluation and improvement

Show the evaluation laboratory. Explain the 100 happy-path, 60 edge, 30 known-failure, and 10 adversarial split. Compare the frozen baseline with the combined candidate. Call out critical guardrail compliance, Recall@5, full expected-source coverage, faithfulness, handoff quality, P95 latency, tokens, and normalized cost. Show the per-improvement ablation table and the nine false-abstention regression analysis. Do not hide negative deltas: all nine were model-generated abstentions after retrieval; one followed the prompt-only lever and eight appeared only when the improved prompt and expanded evidence context were combined.

## 6:45–7:35 — human calibration and operations

Open the 30-case LangSmith annotation queue. Explain the blinded 0–4 rubric, 85% overall agreement target, 100% critical-case agreement target, and zero false-safe target. State the current completion status exactly. Show production health, rate limits, abuse defense, incident documentation, and the rule that release gates can be vetoed by any critical-safety failure.

## 7:35–8:15 — limits and close

State that all evaluation cases are synthetic and de-identified and that the results do not establish field effectiveness or agency approval. Close with the core value: CommonGround turns public guidance and practitioner judgment into a transparent AI workflow that is testable, observable, interruptible, and designed to preserve human choice.

## Recording checklist

- Public site URL visible
- Repository README and reproducibility commands visible
- 200-case LangSmith dataset link visible
- Full baseline and improved experiment links visible
- Direct case-level trace with child spans visible
- Per-improvement ablation and nine-regression analysis visible
- Human-calibration queue and truthful completion status visible
- No API keys, real cases, D1 records, or sensitive browser tabs visible
- Captions enabled and final Loom link copied into the README and evaluation report
