# 0005. The Creative Intelligence Graph Is a Domain Model, Not a Database

## Status

Accepted

## Context

"Creative Intelligence Graph" (CIG) is CIOS's name for the conceptual
relationship model connecting creative entities (characters, scenes,
worlds, themes, etc.) once those entities are defined in a later
directive. The word "Graph" invites an assumption that the underlying
storage technology must be a graph database. This ADR exists specifically
to record and prevent that assumption from being made by default.

## Decision

The CIG is a **domain model** owned by `packages/creative-graph`,
expressed as ordinary TypeScript types/relationships and, once
implemented, persisted via the interfaces `packages/domain`/`packages/
application` define — currently targeting PostgreSQL (ADR 0004). No CIG
entities, node types, or edge types are defined in Directive 002;
`packages/creative-graph` exists only as the architectural placeholder for
this future domain model.

## Consequences

- Choosing PostgreSQL now does not "lock out" a graph database later —
  because the CIG is modeled as a domain concept behind an interface, the
  storage technology underneath it can change without changing the domain
  model's shape, as long as query needs are met.
- Future directives that define CIG entities must place them in
  `packages/creative-graph`, not directly in `packages/domain` (keeping
  the CIG's bounded responsibility distinct from general domain rules) and
  not in `packages/infrastructure` (which must remain implementation/
  adapter code, not domain modeling).
- No query engine, traversal algorithm, or schema is implied by this
  decision.

## Alternatives Considered

- **Treat "Graph" as an instruction to pick a graph database**: rejected —
  this is precisely the premature-technology-choice trap this ADR exists
  to avoid; see ADR 0004 for the reasoning.
- **Fold CIG modeling directly into `packages/domain`**: rejected — the
  CIG is a large, evolving, product-specific concern; giving it its own
  package keeps `packages/domain`'s scope from growing unbounded and keeps
  the CIG's future complexity contained and separately testable.

## What Would Justify Revisiting

- A future directive formally defining CIG entities decides the domain
  model needs a different internal package boundary than
  `packages/creative-graph` — that decision belongs to that directive, not
  this one.
