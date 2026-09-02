# Production readiness and controlled-pilot plan

## Current classification

CommonGround AI is a **public training demonstration**. It is appropriate for synthetic or properly de-identified scenarios only. It is not authorized for criminal justice information, victim records, student records, health information, or other real case data.

The application cannot send messages, create referrals, update agency records, decide eligibility, determine risk, or take any external case action.

## Controls implemented

- Explicit training-only attestation is required by the server for analysis, practice, research, voice transcription, and read-aloud requests.
- Deterministic identifier screening runs before provider calls.
- Turnstile, same-origin checks, strict schemas, input bounds, and distributed D1 rate limits protect public APIs.
- RAG is limited to an approved public corpus with jurisdiction filters, graph expansion, reranking, and claim-level citation validation.
- Weak evidence, prohibited decisions, model-policy failures, or safety-review disagreement cause abstention.
- Fireworks and Mistral independently review releasable drafts.
- Human reviewers can approve, request revision, reject, or escalate. Non-approval outcomes require a rationale.
- Approval tokens are short lived and bound to one workflow.
- D1 stores control metadata and privacy-minimized checkpoints; LangSmith receives metadata-only traces.
- D1 audit events record control outcomes without raw narratives.
- Provider operations use timeouts, bounded retries, and safe error responses.
- A public Trust Center documents security, privacy, accessibility, limitations, and configuration status.

## Release gates for a controlled agency pilot

The following remain mandatory before any real-data or agency-connected deployment:

1. Agency SSO and server-enforced RBAC, with tenant isolation and joiner/mover/leaver controls.
2. Written data classification, retention, deletion, legal-hold, consent, and records procedures.
3. CJIS applicability determination and approval by the responsible agency authority when criminal justice information is in scope.
4. Vendor security and contractual review for Fireworks, Pinecone, Mistral, LangSmith, Deepgram, Neo4j, You.com, Cloudflare, and the hosting environment.
5. Independent threat modeling, source/dependency scanning, SBOM, penetration testing, and backup restoration exercise.
6. Independent WCAG 2.2 AA audit and remediation.
7. Domain-expert human calibration with at least two reviewers, inter-rater agreement, adversarial testing, and documented acceptance thresholds.
8. Staging/production separation, deployment approvals, rollback, SLOs, alerts, incident ownership, and cost controls.
9. Agency-approved corpus administration with document review, effective dates, versioning, expiration, staging, publication, and rollback.
10. Privacy, legal, records, accessibility, victim-services, youth-safety, and procurement sign-off.

## Recommended rollout

| Stage | Data | Audience | Exit evidence |
| --- | --- | --- | --- |
| Public demo | Synthetic only | Class and conference visitors | Automated tests and visible boundaries |
| Usability pilot | Synthetic/de-identified | Facilitators and victim advocates | Task completion and accessibility findings |
| Controlled agency pilot | Only approved data classes | One approved team | Security, legal, identity, human-eval, and incident approvals |
| Production | Agency-authorized | Approved roles and tenants | SLOs, monitoring, audits, rollback, and continuing evaluation |

## Governance references

- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [NIST Generative AI Profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf)
- [OWASP GenAI LLM Top 10](https://genai.owasp.org/resource/owasp-genai-llm-top-10-2026/)
- [FBI CJIS Security Policy Resource Center](https://www.fbi.gov/services/cjis)
- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)

