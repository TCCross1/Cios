# 0006. AI Output Is a Proposal Until Accepted Into Canonical State

## Status

Accepted

## Context

CIOS's core promise is that human creator authority is supreme — AI may
analyze, generate, and recommend, but must never silently become the
source of truth for a creative universe. Without an explicit architectural
rule, it is easy for a well-intentioned implementation to let an AI
provider's response flow directly into canonical storage "for convenience"
during a later feature directive.

## Decision

AI/agent output is always represented as a distinct **proposal** type,
never as a canonical entity or canonical mutation. The lifecycle is:

```
OBSERVE → ANALYZE → PROPOSE → REVIEW / POLICY CHECK →
CREATOR OR AUTHORIZED DECISION → COMMIT → VERSION → PROVENANCE → PROJECT
```

Only an explicit application/domain "commit" operation — authorized by the
creator or an explicitly delegated policy — transitions a proposal into
canonical state. No infrastructure adapter, agent-runtime component, or
provider SDK is permitted to write directly to canonical storage.

## Consequences

- `packages/agent-runtime` and future provider adapters in
  `packages/infrastructure` return typed proposal/result objects, not
  canonical entities.
- `packages/application` (or a future dedicated module within it) owns the
  "acceptance" use case that transitions a proposal to canonical state,
  including whatever review/policy check is required.
- Canonical mutation code paths can assume their input has already passed
  through creator/policy authorization — they do not need to re-implement
  "is this AI-generated and unapproved?" checks scattered throughout the
  codebase.
- No proposal schema, review workflow, or policy engine is implemented in
  Directive 002 — this ADR fixes the invariant for when they are.

## Alternatives Considered

- **Let agents write directly to canonical tables with an `is_ai_generated`
  flag**: rejected — conflates lifecycle stages (generated output vs.
  accepted change vs. canonical state) that the Constitution requires to
  stay distinct, and makes it easy to accidentally treat unapproved output
  as truth (e.g. a query that forgets to filter the flag).
- **Require synchronous human approval for every AI action**: rejected as
  a blanket rule — the Constitution allows "an explicitly delegated
  policy" to authorize acceptance, leaving room for trusted, narrow
  auto-accept rules in later directives without abandoning the
  proposal/commit distinction itself.

## What Would Justify Revisiting

- A future directive defines a delegated-policy model that needs a richer
  lifecycle than propose/commit (e.g. multi-stage review) — that would
  extend, not abandon, this ADR's core invariant.
