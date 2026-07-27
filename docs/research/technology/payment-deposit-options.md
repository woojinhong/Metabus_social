---
title: Payment, Deposit, and No-Show Options
document_type: technology research
classification: research finding
status: draft for review
last_verified: 2026-07-27
related: README.md; ../../spec/mvp-scope.md
decision_authority: docs/discovery/decisions.md only
---

# Payment, Deposit, and No-Show Options

## Boundary

Proposal - unapproved: payments, refundable deposits, penalties, and offline venue deposits are excluded from the proposed initial pilot. This is future-only research; it does not recommend a payment flow or vendor.

## Candidate comparison

| Future use | Candidate route | Key risk | Current assessment |
| --- | --- | --- | --- |
| Session fee | Domestic web PG such as Toss Payments or PortOne-integrated PG | Consumer, receipt, refund, and platform rules | Deferred |
| Refundable reservation deposit | Authorization, charge, and refund process | Disputes, technical failure, operator cancellation, fairness perception | Deferred; not simple payment |
| Offline venue deposit | Venue or booking partner | High operations and cancellation burden | Deferred |
| Mobile digital access | Store billing context | Distribution and entitlement rules | Future research |

## Future decision criteria

- Separate session fee, refundable reservation commitment, no-show charge, and venue deposit; they have distinct legal, operational, and fairness consequences.
- Require explicit refund, partial refund, operator-cancellation, chargeback, tax/receipt, and support policy before payment approval.
- Recommendation: exclude payment/deposit from the initial proposed pilot.
- Fallback: retain free participation only while a separate validation and legal review run.
- Approval gate: payment design, provider, and deposit policy each require explicit approval; no ADR is proposed.

## Cost evidence

Research finding: PortOne publishes platform-plan context while underlying PG fees are separate; Toss Payments publishes product documentation. Evidence gap: Korean fees, holds, support fees, and disputes depend on merchant and PG contracts. Initial-pilot payment cost is N/A because payment is excluded.

## Source ledger

- Title: PortOne pricing
  - Publisher: PortOne
  - URL: https://portone.io/pricing
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: PortOne publishes the KRW plan thresholds and rates shown in the price snapshot.
  - Limitations: Underlying PG fees, VAT, and contracts vary.

- Title: Toss Payments developer documentation
  - Publisher: Toss Payments
  - URL: https://docs.tosspayments.com/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Toss documents payment and cancellation surfaces.
  - Limitations: Documentation does not settle product policy or legality.

- Title: App Review Guidelines
  - Publisher: Apple
  - URL: https://developer.apple.com/app-store/review/guidelines/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Apple publishes mobile-payment policy context.
  - Limitations: Applicability depends on final transaction type.

- Title: Google Play payments policy
  - Publisher: Google
  - URL: https://support.google.com/googleplay/android-developer/answer/9858738
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Google publishes payment-policy context.
  - Limitations: Current legal and commercial interpretation is required.


## Why exclusion is the current proposal

- A deposit can be experienced as payment for access to people, even when refundable; product language and consumer fairness need review.
- No-show enforcement requires evidence of attendance, technical-failure handling, operator cancellation, and appeal; each raises support and evidence-retention cost.
- Authorization holds, captures, and refunds are different financial actions and may have different provider support and user expectations.
- Offline venue coordination adds venue, availability, cancellation, and safety operations beyond an online-session pilot.

## Future evaluation matrix

| Criterion | Evidence required before a proposal changes |
| --- | --- |
| No-show reduction | Controlled test comparing attendance and friction |
| Refund fairness | Policy review with technical and operator failure scenarios |
| Legal/tax treatment | Qualified Korean legal and tax review |
| Platform distribution | Current store and web payment policy review |
| Support load | Dispute-volume and response-time model |
| Vendor exit | Export, reconciliation, refund, and customer-notice plan |


## Public price snapshot - future-only research

| Provider/service | Current public price evidence | Limitation |
| --- | --- | --- |
| PortOne Free | KRW 0/month below KRW 50m monthly net transaction volume | VAT excluded; underlying PG fees separate |
| PortOne Growth 1 | KRW 100,000/month for KRW 50m to less than KRW 100m monthly net volume | VAT excluded; annual billing discount shown separately |
| PortOne Growth 2 | KRW 300,000/month for KRW 100m to less than KRW 500m monthly net volume | VAT excluded; underlying PG fees separate |
| PortOne Growth 3 | KRW 500,000/month for KRW 500m or more monthly net volume | VAT excluded; contract/PG terms still apply |
| Toss Payments | Official documentation reviewed; public universal merchant unit rate not established | Contract/PG method, tax, and refund terms TBD |

Research finding: PortOne describes monthly net transaction volume as gross transactions less same-period cancellations/refunds. Proposal - unapproved: initial payment/deposit cost remains N/A because payment is excluded from the initial pilot.
