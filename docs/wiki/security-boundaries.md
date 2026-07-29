---
title: Security Boundaries Summary
document_type: wiki
classification: confirmed fact
status: Non-authoritative summary
last_verified: 2026-07-28
related_documents: ["../spec/security/identity-admission-and-invitations.md","../operations/moderation-sanctions-and-appeals.md"]
decision_authority: none
---

# Security Boundaries Summary

Account authentication, adult eligibility, reservation and admission are separate proofs. NICE produces a minimal adult outcome; raw DOB, CI/DI, documents and biometrics are not stored. Invitations navigate only; backend rechecks account, eligibility, reservation, attendance, sanction, stage and replay before short-lived RTC authority.

Backend owns stages, permissions, interests and reveal. RTC presence is observation. Recording is off, but local screenshots/recording cannot be prevented. Private choices and sensitive identity/profile data stay out of general telemetry.

Moderation uses deterministic hold, human review, proportional sanctions and
independent appeal. LLMs cannot solely impose irreversible sanctions. D-024
approved the report, recovery and moderator UX baseline; exact authorization
and implementation contracts remain pending separate promotion.

