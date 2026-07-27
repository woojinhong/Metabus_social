---
title: Identity and Adult-Eligibility Options
document_type: technology research
classification: research finding
status: draft for review
last_verified: 2026-07-27
related: README.md; ../../architecture/security-privacy.md
decision_authority: docs/discovery/decisions.md only
---

# Identity and Adult-Eligibility Options

## Research boundary

Research finding: Korean carrier and phone identity products, including NICE, PASS, and KCB categories, need commercial and legal verification for fields and permitted use. Proposal - unapproved: minimize identity data and exclude biometric comparison, liveness, and manual-ID processing from the initial proposed pilot.

## Candidate comparison

| Option | Conversion and fraud resistance | Privacy burden | MVP fit | Proposal assessment |
| --- | --- | --- | --- | --- |
| Account + phone verification | Moderate; does not prove adulthood alone | Lower than biometrics | Account binding and notices | Baseline research option |
| Korean carrier adult/identity attestation | Potentially strong local fit | CI/DI implications need counsel | Only after legal/commercial verification | Conditional option |
| Document verification + liveness | Higher fraud control | Sensitive/biometric and manual-review burden | Not initial pilot | Excluded |
| Face comparison / duplicate biometrics | May deter some fraud | High sensitive-data and fairness burden | Not initial pilot | Excluded |

## Proposal - unapproved recommendation

- Use account-bound phone verification as minimum research baseline.
- Consider Korean adult attestation only after review confirms minimization, consent, retention, deletion, coverage, and contract terms.
- Do not collect raw ID documents, liveness data, or face-comparison biometrics in the proposed initial pilot.
- Fallback: if lawful adult verification cannot be obtained with acceptable handling, do not run the adult-dating session; do not substitute manual processing.
- Approval gate: provider, CI/DI handling, biometric processing, and manual review require explicit user and legal/privacy approval.

## Evidence gaps

Foreign residents, MVNO users, accessibility, false-rejection recovery, data residency, deletion APIs, and provider pricing remain unconfirmed. Phone possession and adult eligibility are separate claims.

## Source ledger

- Title: Personal Information Protection Commission
  - Publisher: PIPC, Republic of Korea
  - URL: https://www.pipc.go.kr/eng/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: PIPC is the primary Korean privacy-guidance source for review.
  - Limitations: This is not legal advice or an integration specification.

- Title: NICE Identity overview
  - Publisher: NICE Information Service
  - URL: https://www.niceid.co.kr/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: A Korean identity-verification provider category exists.
  - Limitations: Availability, fields, and use need direct confirmation.

- Title: Persona documentation
  - Publisher: Persona
  - URL: https://docs.withpersona.com/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: International verification products document identity workflows.
  - Limitations: This does not establish Korean-market fit or approval.


## Evaluation criteria

| Criterion | Reason | Evidence needed |
| --- | --- | --- |
| Adult eligibility | Dating service needs an adult-only boundary | Provider field definition and legal review |
| Data minimization | Identity data is sensitive and durable | Exact returned fields and retention map |
| Coverage | Exclusion can create safety and conversion harm | Foreign resident, MVNO, disability, and recovery assessment |
| Fraud resistance | Phone-only accounts can be abused | Rate limits, duplicate signals, and escalation path |
| Deletion and audit | Users need accountable lifecycle | Provider deletion/export terms and audit design |
| Manual review | Exceptions can create bias and sensitive-data exposure | Separate approved operating policy |

## Security and exit notes

- Proposal - unapproved: isolate identity-provider tokens and results behind a narrow adapter; do not expose raw verification artifacts to general support roles.
- Store an eligibility outcome and limited provider reference only when necessary; exact retention is an open question.
- Vendor exit requires a lawful re-verification plan, not silent reuse of provider-specific identifiers.
- Legal/privacy review must address sensitive-information classification, processor roles, consent, notices, and cross-border transfer before procurement.
