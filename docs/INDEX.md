# Documentation Index

## Current phase

**Confirmed fact:** The project is in product discovery. Product scope, MVP, architecture, technology stack, database, APIs, and implementation are not approved.

## Read order

1. This index.
2. [discovery/decisions.md](discovery/decisions.md) for approved decisions.
3. [discovery/product-concept.md](discovery/product-concept.md) for unresolved product exploration.
4. [discovery/product-brief.md](discovery/product-brief.md), [discovery/assumptions.md](discovery/assumptions.md), and [discovery/open-questions.md](discovery/open-questions.md).
5. Relevant material in [research/](research/README.md), [spec/](spec/README.md), [architecture/](architecture/README.md), and [adr/](adr/README.md).
6. [operations/ai-runtime.md](operations/ai-runtime.md) for the verified AI tooling setup.

## Discovery documents

- [Product concept](discovery/product-concept.md): exploratory working document; nothing is automatically approved.
- [Product brief](discovery/product-brief.md): destination for sufficiently validated, approved product conclusions.
- [Assumptions](discovery/assumptions.md): detailed assumption tracking.
- [Open questions](discovery/open-questions.md): unresolved questions by domain.
- [Decisions](discovery/decisions.md): the only record of approved decisions.

## Authority hierarchy

1. Exp
3. Research findings with cited sources and verification dates.
4. Assumptions, proposals, and open questiolicit user approvals recorded as approved entries in docs/discovery/decisions.md.
2. Confirmed facts supported by direct evidence.ns.

Only approved entries in docs/discovery/decisions.md are decisions. Unapproved proposals are non-authoritative.

## Classification

- **Confirmed fact:** Directly verified project or external reality.
- **User decision:** An explicit user approval recorded in the decision log.
- **Assumption:** An unverified belief that needs evidence.
- **Research finding:** Source-backed information that informs, but does not make, a decision.
- **Proposal:** A candidate approach awaiting approval.
- **Open question:** An unresolved matter that may affect scope or design.

Research does not become a requirement automatically. A proposal or model inference never becomes a decision without explicit user approval.

## Documentation update rules

- Label new statements with one of the classifications above.
- Record approvals only in docs/discovery/decisions.md using its decision format.
- Keep assumptions and open questions current when evidence or approvals change.
- Include sources, source dates, verification dates, and uncertainty in research.
- Keep proposals separate from accepted decisions.
- Update links when documents move.

When code eventually exists, it is evidence of current behavior, not automatic authority over approved product decisions.
