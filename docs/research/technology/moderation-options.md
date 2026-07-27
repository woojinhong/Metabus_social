---
title: Moderation and Anti-Promotion Options
document_type: technology research
classification: research finding
status: draft for review
last_verified: 2026-07-27
related: README.md; ../../architecture/security-privacy.md
decision_authority: docs/discovery/decisions.md only
---

# Moderation and Anti-Promotion Options

## Candidate control comparison

| Control | Strength | Limitation | Proposal role |
| --- | --- | --- | --- |
| Deterministic text patterns | Fast for URL, phone, email, and handles | Evasion and Korean-language variation | Baseline |
| QR/barcode and image inspection | Detects visual contact sharing | False outcomes; privacy review needed | Upload control |
| EXIF removal | Reduces metadata leakage | Does not remove visual location clues | Upload hygiene |
| Reputation/rate limits | Reduces repeated solicitation | Can burden legitimate participants | Supporting control |
| ML or LLM review | Helps triage nuance | Error, explainability, data handling | Assistive only |
| Human review and appeal | Contextual judgment | Cost, bias, response time | Escalation path |

## Proposal - unapproved recommendation

- Combine deterministic filters, QR/image scanning, rate limits, reporting, human review, sanctions, and appeal.
- Do not use an LLM as sole enforcement or expose private interest choices to staff without a need-based role.
- Treat Instagram/Kakao IDs, open-chat links, phone numbers, email, URLs, QR codes, account numbers, repeated promotion, and commercial offers as stage-policy inputs.
- Fallback: fail safely by withholding a message/media and route a contested decision to review.
- Approval gate: moderation policy, vendor, retention, sanctions, and appeal require explicit review.

## Privacy and scale

Proposal - unapproved: retain minimum report/appeal evidence, segregate moderator access, audit actions, and protect reporter identity. Automated inspection can itself expose sensitive content and needs processor assessment. Human moderation and support are capacity costs, not a free automation feature.

## Source ledger

- Title: Application Security Verification Standard
  - Publisher: OWASP Foundation
  - URL: https://owasp.org/www-project-application-security-verification-standard/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: ASVS provides authorization, logging, and input-handling verification guidance.
  - Limitations: It is not a moderation product specification.

- Title: Sensitive Data Protection overview
  - Publisher: Google Cloud
  - URL: https://cloud.google.com/sensitive-data-protection/docs/overview
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: Official documentation illustrates deterministic and inspection-oriented controls.
  - Limitations: This is not a vendor selection.

- Title: Usage policies
  - Publisher: OpenAI
  - URL: https://openai.com/policies/usage-policies/
  - Publication/update date: not stated
  - Verification date: 2026-07-27
  - Supported claim: AI moderation must account for provider policy and human oversight.
  - Limitations: This does not endorse an LLM moderation vendor.


## Enforcement decision criteria

| Situation | Proposed response class | Required safeguard |
| --- | --- | --- |
| Obvious contact identifier in prohibited stage | Deterministic hold | Clear participant explanation and appeal |
| QR code in uploaded media | Hold or reject pending review | False-positive recovery and audit |
| Repeated solicitation | Rate-limit and review escalation | No public retaliation signal |
| Harassment or sexual misconduct report | Immediate safety escalation | Reporter protection and evidence access control |
| Ambiguous cultural or language context | Human review, not LLM-only action | Consistent guidance and appeal |
| Moderator misuse | Restricted role and audit | Break-glass monitoring and separation of duties |

## Scale, exit, and evidence limits

- Human review queues need service targets, staffing assumptions, escalation, and quality audit; automation cannot erase this operating burden.
- Any vendor receiving media/text becomes a privacy and processor-review question; minimize payload and retention.
- Deterministic rules are portable; vendor-specific classifier scores and policies may not be.
- Report abuse is a threat model item: repeated false reports must not automatically reveal reporter identity or create instant irreversible punishment.
- Effectiveness metrics should include false-positive recovery, report resolution time, repeat solicitation, and participant safety perception, not removal count alone.
