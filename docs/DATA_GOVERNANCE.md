# Data and evidence governance

## Public-demo data policy

Only synthetic or properly de-identified training input is permitted. Users must not enter names, contact information, addresses, dates of birth, report or case identifiers, student identifiers, health identifiers, criminal-history information, confidential narratives, or agency-restricted material.

Automated screening is a risk-reduction control, not a guarantee of de-identification.

## Data inventory

| Data class | System | Stored by CommonGround | Current rule |
| --- | --- | --- | --- |
| Training narrative | Request memory and model providers | No durable application storage | Synthetic/de-identified only |
| Audio | Deepgram request | No | Training voice only; size/time bounded |
| Retrieval corpus | Pinecone and Neo4j | Approved public summaries and metadata | Curator-reviewed sources only |
| Workflow checkpoint | D1 | Privacy-minimized control state | Narrative, vector, excerpts, and brief removed |
| Audit metadata | D1 | Event, trace/resource ID, role, outcome, non-sensitive details | No narrative or review comment text |
| Observability | LangSmith | Counts, duration, status, scores, versions | Raw prompts and outputs disabled |
| Public freshness results | Request response | Monitor-run counts only | Cannot publish or re-index automatically |

## Corpus lifecycle

1. Discover candidate source on an allowlisted domain.
2. Open and compare the complete source; snippets are never authoritative.
3. Record owner, jurisdiction, publication/effective date, topic, safeguards, and direct URL.
4. Review the summary for accuracy, scope, and victim-centered language.
5. Stage in a non-production namespace and run retrieval/evaluation suites.
6. Obtain curator approval before production publication.
7. Version the corpus and preserve rollback evidence.
8. Re-review on expiration, material policy change, broken link, or evaluation regression.

The public monitor is advisory. It cannot update Pinecone, Neo4j, or the answer corpus.

## Agency-pilot additions

An agency must define data ownership, lawful basis, consent, minimum-necessary use, retention, deletion, records requests, legal hold, breach response, data residency, subprocessors, provider retention/training terms, audit access, and offboarding before real information is enabled.

