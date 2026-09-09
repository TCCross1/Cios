# 0007. Versioned Canonical State + Append-Oriented Provenance

## Status

Accepted

## Context

CIOS must be able to answer, for any meaningful committed creative change:
what changed, who/what proposed and approved it, what source material and
prior version it derived from, what tools/models participated, when it
happened, and what version became canonical (Constitution §E). A full
event-sourcing architecture (every domain object as a pure event-sourced
aggregate, canonical state always derived by replaying events) is one way
to get this, but is a heavy, invasive architectural commitment.

## Decision

CIOS uses **versioned canonical state** (each canonical entity has an
explicit version/history, not just a single mutable row) **plus an
append-oriented provenance/audit history** (an append-only log of who/what
changed what, when, and why) — rather than full event sourcing across the
entire system.

`packages/provenance` owns this concern's domain boundary. No provenance
schema or storage is implemented in Directive 002.

## Consequences

- Reads can query current canonical state directly and efficiently,
  without replaying an event log.
- Provenance/audit records are append-only and never mutated once written,
  giving a reliable audit trail without forcing every domain object into
  event-sourced modeling.
- Domain objects are modeled the way that best fits their own rules; only
  the provenance/history mechanism is standardized.
- Later directives defining `packages/provenance`'s schema must preserve
  this shape: versioned entities + an append-only provenance log, not a
  replacement of canonical rows with an event stream.

## Alternatives Considered

- **Full event sourcing for all domain objects**: rejected as a blanket
  strategy — significantly increases complexity (projections, replay,
  snapshotting) for objects that do not need it, and was explicitly ruled
  out by the directive ("This does NOT require full event sourcing for the
  entire system... Do not turn every domain object into a pure
  event-sourced aggregate without demonstrated need").
- **Single mutable row with no history**: rejected — cannot answer the
  provenance questions the Constitution requires (prior version, lineage
  reconstruction).
- **Provenance embedded as JSON blobs on the canonical row itself**:
  rejected — provenance is conceptually append-only and should not be
  mutated alongside the entity it describes; keeping it as a separate
  append-oriented record set (in `packages/provenance`'s future schema)
  keeps the two concerns cleanly separable.

## What Would Justify Revisiting

- A specific domain object is demonstrated to need full event-sourced
  replay (e.g. for conflict resolution in collaborative editing) — that
  could be adopted for that object specifically without changing this
  ADR's default.
