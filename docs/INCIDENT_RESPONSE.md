# Incident response playbook

## Scope

This playbook covers model-provider failures, unsafe output, sensitive-data exposure, compromised credentials, abuse, incorrect evidence, service outages, and unexpected cost or traffic events.

## Immediate response

1. Stop the affected capability or set `LIVE_AI_ENABLED=false` when generation must be disabled.
2. Preserve privacy-minimized logs, trace IDs, release versions, and audit-event metadata. Do not copy sensitive narratives into tickets or chat.
3. Rotate affected credentials and revoke provider/session access when compromise is suspected.
4. Identify affected routes, providers, corpus versions, prompts, time window, and users without expanding data exposure.
5. Notify the designated security, privacy, product, victim-services, and agency contacts according to the approved severity matrix.
6. Keep real-case processing disabled; the current public deployment already prohibits it.

## Severity guide

| Severity | Example | Initial action |
| --- | --- | --- |
| Critical | Confirmed sensitive-data disclosure or credential compromise | Disable affected capability, rotate credentials, notify owners immediately |
| High | Unsafe output passes all gates or unauthorized approval activity | Disable release path, preserve evidence, begin review |
| Medium | Provider outage, sustained high latency, or repeated safe failures | Activate fallback/disable feature and communicate status |
| Low | Cosmetic issue or isolated non-safety error | Record, prioritize, and verify fix |

## Recovery and learning

- Restore only after the owner verifies containment and regression tests pass.
- Add the failure as a synthetic golden-dataset case when safe and useful.
- Record cause, user impact, controls that worked or failed, remediation owner, due date, and validation evidence.
- Review provider, prompt, corpus, and deployment versions together.
- Test rollback and backup restoration on a scheduled cadence during any controlled pilot.

The public `/status` endpoint reports configuration, not an SLA or external provider uptime. An agency pilot still needs independent infrastructure monitoring and an on-call process.

