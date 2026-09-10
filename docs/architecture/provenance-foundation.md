# Provenance Foundation (Directive 004)

Status: Implemented (foundational only). Package: `@cios/provenance`
(`packages/provenance/src`).

This document describes the foundational provenance/lineage model — the
deterministic, framework/persistence/AI-independent vocabulary for
recording WHERE a piece of creative material came from and HOW it was
derived. It does **not** describe the future Canon Ledger, Creation
Graph, Spark Engine, or any system that will eventually _consume_
provenance records to make authority decisions.

## Core Modeling Principle

A `ProvenanceRecord` answers exactly two questions — **who/what
contributed** and **what it was derived from** — and nothing else:

- It is not a content object: it carries no descriptive payload
  (`content`, `metadata`).
- It is not a Canon/authority decision: it carries no `canon`,
  `isCanon`, `canonState`, `approved`, `confidence`, `quality`, or
  `authority` field.
- It is not a mutable resource: it has a single `createdAt` and no
  `updatedAt` — a lineage fact does not change after it is recorded; a
  corrected understanding of lineage is a new record, not an edit.
- It is not addressed by a generic subject pointer: it has no
  `subject`/`subjectId`/`subjectType`/`resourceType`/`resourceId` field.
  Any future artifact that needs to point at a provenance fact does so
  via a `ProvenanceRef`, never the reverse.

## Vocabulary

### `ProvenanceId`

A branded (nominal) UUID v4 string identifying exactly one
`ProvenanceRecord`, following the same branding strategy as
`@cios/domain`'s `UniverseId`/`WorkId`/`EntityId` (ADR 0013) but with its
own private brand symbol, so it is never mutually assignable with a
domain identifier at compile time. `createProvenanceId(raw)` validates a
caller-supplied string; `generateProvenanceId()` generates one via
`globalThis.crypto.randomUUID()` (no `node:crypto`); `isProvenanceId`
is the runtime type guard.

### `ProvenanceType`

An exact 7-value union — no synonym is ever accepted:

| Value                | Meaning                                                              |
| -------------------- | -------------------------------------------------------------------- |
| `creator-original`   | Authored solely by a human creator; no AI contribution.              |
| `ai-interpretation`  | AI-derived reading/analysis of existing material; requires a parent. |
| `ai-suggestion`      | AI-proposed material; a parent is optional.                          |
| `ai-expansion`       | AI-derived elaboration of existing material; requires a parent.      |
| `ai-revision`        | AI-derived alteration of existing material; requires a parent.       |
| `hybrid`             | Both a human creator and AI materially contributed.                  |
| `imported-reference` | Sourced from external material rather than authored in CIOS.         |

### `ProvenanceContributorRef`

`{ contributorKind: ProvenanceContributorKind, contributorRef: string }`
where `ProvenanceContributorKind` is `'creator' | 'ai'` — an opaque,
trimmed, non-empty identifier for who contributed. Contributor
classification is provider-independent: this package does not resolve
`contributorRef` to an actual account/model identity, and does not
encode any particular AI provider or vendor; that resolution is out of
scope for this foundation.

### `ExternalSourceRef`

`{ sourceKind: 'url' | 'file' | 'publication' | 'other', locator:
string, label?: string }` — a validated pointer to external material.
For `sourceKind: 'url'`, the locator must be an absolute `http:` or
`https:` web-reference URL (parsed with the platform `URL` parser and
checked by exact protocol — no other scheme is accepted). For `file`,
`publication`, and `other`, the locator is treated as an opaque,
trimmed, non-empty string. Validation is deterministic and syntax-only;
no network, DNS, or filesystem access is performed, and a
successfully-validated `url` locator is **not** thereby known to be
safe, trustworthy, or reachable — only its reference scheme is
constrained.

### `ProvenanceRef`

`{ universeId: UniverseId, provenanceId: ProvenanceId }` — a lightweight
pointer at one `ProvenanceRecord`, used both as this package's public
lineage-pointer type and as the shape of each `ProvenanceRecord.parents[]`
entry.

### `ProvenanceRecord`

```
{
  provenanceId: ProvenanceId
  universeId: UniverseId
  provenanceType: ProvenanceType
  contributors: readonly ProvenanceContributorRef[]
  parents: readonly ProvenanceRef[]
  sources: readonly ExternalSourceRef[]
  createdAt: UtcTimestamp
}
```

`createdAt` reuses `@cios/domain`'s calendar-strict `UtcTimestamp`
validation directly (no duplicated calendar logic). Every field is
`readonly`, and every returned record — along with its `contributors`,
`parents`, and `sources` arrays and each object within them — is
`Object.freeze`d at runtime; construction always builds fresh objects
from caller input rather than freezing the caller's own arrays/objects,
so later mutation of a caller's input can never affect an already-built
record.

## Per-Type Structural Invariants

Each `ProvenanceType` enforces a mechanical, deterministic shape rule —
never a subjective judgment about truth, quality, or Canon-worthiness:

| Type                 | Contributors                 | Parents                     |
| -------------------- | ---------------------------- | --------------------------- |
| `creator-original`   | ≥1 `creator`, 0 `ai`         | unconstrained               |
| `ai-interpretation`  | ≥1 `ai`, 0 `creator`         | ≥1 required                 |
| `ai-suggestion`      | ≥1 `ai`, 0 `creator`         | optional                    |
| `ai-expansion`       | ≥1 `ai`, 0 `creator`         | ≥1 required                 |
| `ai-revision`        | ≥1 `ai`, 0 `creator`         | ≥1 required                 |
| `hybrid`             | ≥1 `creator` AND ≥1 `ai`     | optional                    |
| `imported-reference` | unconstrained (may be empty) | n/a — requires ≥1 `sources` |

## Parent Lineage Rules

A `ProvenanceRecord`'s `parents` are shallow pointers, not a validated
graph:

- Every parent must share the record's own `universeId` (no
  cross-universe parents).
- A record must not list itself as its own parent (no direct
  self-parent).
- A record must not list the same parent twice.
- Parent **existence** is not validated against any store, and
  **indirect (multi-hop) cycles are not detected** — both are explicitly
  out of scope for this foundation and would require a graph/repository
  this package intentionally does not have. A future Creation Graph is
  responsible for that validation.

## Duplicate Detection

Duplicate contributors (`contributorKind` + normalized/trimmed
`contributorRef`) and duplicate sources (`sourceKind` + normalized
locator) are **rejected**, never silently deduplicated. A different
`sourceKind` reusing the same locator string remains a distinct, allowed
entry.

## Error Model

Every construction function throws the shared `DomainValidationError`
(imported directly from `@cios/domain`, never duplicated), with a
dot-notation code under a scope matching the concept it validates
(`provenance_id.*`, `provenance_type.*`, `provenance_contributor.*`,
`external_source_ref.*`, `provenance_ref.*`, `provenance_record.*`).
Codes are the stable machine contract; human-readable messages are not.

## Intentionally Deferred

This foundation does **not** implement, and must not be assumed to
imply: a durable, queryable Provenance Ledger; parent-existence
validation; cross-record cycle detection; the Canon Ledger; the Creation
Graph engine; the Spark Engine; the Interpretation Engine; Story Genome;
Creator Intent; Muse; Creative Chief; AI invocation/providers;
persistence/repositories/a database; a product API or UI; authentication;
billing; Production Studios; or the Adaptation Engine. See
`docs/architecture/adr/0014-provenance-lineage-model.md` for the reasoning
behind these boundaries.
