---
title: External Services Register: Trust and Commerce
document_type: build-versus-buy register
classification: proposal
status: Unapproved
last_verified: 2026-07-27
related: [../discovery/product-concept.md, ../discovery/decisions.md]
decision_authority: Only explicit approvals in ../discovery/decisions.md
---

# External Services Register: Trust and Commerce

**Proposal — unapproved.** Biometric processing and payment are excluded from the initial boundary.

| Service / need | Build option | Buy candidates | Pricing basis / evidence | Advantages / disadvantages | Privacy and integration | Failure / fallback | Lock-in / exit | Recommendation / approval |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Phone/adult evidence | OTP only; cannot create carrier evidence | NICE/KCB/PASS categories; verify terms | Verification attempt/result, channel and volume; Korean provider contract-only/TBD | Korean conversion/fraud reach; false results/vendor burden | Phone, age/identity result, possible CI/DI; very high | Fail closed; reschedule; no assumed manual path | Store minimal result; alternate provider | Research minimal attestation; legal/user approval |
| ID document verification | Build review is high risk | Persona, Veriff, Entrust/Onfido equivalents | Verification/check, document type, region and manual-review add-on; public list where offered plus contract | Fraud tooling; biometric/cross-border burden | ID/face/biometric; extreme | No initial fallback | Deletion/export/contract | Defer; separate biometric approval |
| Liveness/face comparison | Not credible/safe MVP build | Specialized identity vendors | Liveness/face-comparison attempt and manual-review case; usually contract-only/TBD | Fraud resistance; bias/false rejection | Biometric processing; extreme | Accessible alternative required | Model/vendor dependence | Defer; legal and explicit approval |
| Payments/deposits | Direct acquiring/ledger | Toss Payments, PortOne/domestic PG, app stores | Transaction value/count, PG percentage/fixed fee, refund/chargeback, monthly platform tier; current official terms/contract | Compliance/network access; refund/store complexity | Financial/contact records; very high | Excluded MVP; future alternate PG | Token portability/ledger export | Exclude initial MVP; future approval |
| Text moderation | Regex/rules/reputation | Cloud moderation/LLM assist | Character/token/request or moderation case plus human-review labor; public list/contract | Vendor context help; false positives and privacy | Participant text; high | Deterministic rules + human review | Keep policy/rules in app | Hybrid; LLM never sole control |
| Image moderation | Local metadata/size/QR checks | Image safety vendor | Image/request, feature/classifier, storage/egress and manual-review case; public list/contract | Classifier coverage; false results | Participant media; very high | Quarantine/human review | Store vendor-neutral findings | Buy signal after privacy approval |
| QR detection | Open library/OCR | Vision provider | Image/page/request and OCR feature; local option uses compute/maintenance; official list/contract | Local minimizes transfer; maintenance tradeoff | Participant media; high | Quarantine/manual review | Open format and swappable engine | Prefer deterministic local capability later |
| Customer support | Internal tools/process | Helpdesk vendor | Agent seat, ticket/contact, automation or messaging add-on; public tier plus contract | Workflow/SLAs; broad data access | Account/case evidence; very high | Minimal internal case queue | Export/deletion/role controls | Buy only after access design |
| Human moderation | Staff/contract operation | Specialist provider | Reviewer labor hour/shift, case, language/coverage/SLA and training; contract-only/TBD | Coverage; consistency/bias/cost | Reports/evidence/private choices; extreme | On-call escalation | Training/policy/evidence export | Define internal accountability before buy |

## Pricing evidence

Current exact identity, payment, and moderation rates and limitations belong in [identity research](../research/technology/identity-verification-options.md), [payment research](../research/technology/payment-deposit-options.md), and [moderation research](../research/technology/moderation-options.md). Contract-only items remain TBD.

## Identity acceptance criteria

Provider must document Korean web/mobile UX, adult result semantics, CI/DI handling, retention/deletion, accessibility, false acceptance/rejection, fraud support, subprocessing/residency, pricing, and incident response. Phone possession is not equivalent to identity or adulthood.

## Payment boundary

No payment requirement, refund workflow, provider integration, payment ADR dependency, or cost is included initially. A later proposal must separately analyze session fee, refundable reservation deposit, offline deposit, penalty, authorization hold, refund, operator cancellation, technical failure, chargeback, tax/receipt, and app-store rules.

## Moderation boundary

Deterministic filters, rate/reputation rules, image/QR signals, and human review form defense in depth. Automated results are evidence signals, not unappealable truth. Sensitive evidence access is case-scoped and audited.

