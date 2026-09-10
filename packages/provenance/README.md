# @cios/provenance

Immutable lineage/provenance model for CIOS: records WHERE a piece of creative material came from and HOW it was derived. Depends only on `@cios/domain` per `docs/architecture/dependency-policy.json`.

## Status

Directive 004: implements the foundational Provenance model —
`ProvenanceId` (branded, UUID v4), `ProvenanceType` (a fixed 7-value
union: `creator-original`, `ai-interpretation`, `ai-suggestion`,
`ai-expansion`, `ai-revision`, `hybrid`, `imported-reference`),
`ProvenanceContributorRef` (`ProvenanceContributorKind`: `creator` |
`ai`), `ExternalSourceRef` (`url` — `http:`/`https:` only | `file` |
`publication` | `other`), `ProvenanceRef` (`{
universeId, provenanceId }`), and `ProvenanceRecord`. Every construction
function returns a runtime-frozen value, identifier generation uses the
portable Web Crypto API (`globalThis.crypto`, not `node:crypto`), and
`createdAt` reuses `@cios/domain`'s calendar-strict `UtcTimestamp`
validation without duplicating it.

`ProvenanceRecord` deliberately does not carry a `subject`/`subjectId`/
`subjectType`, `updatedAt`, or any Canon/authority field (`canon`,
`isCanon`, `canonState`, `approved`, `confidence`, `quality`,
`authority`). It is a single immutable point-in-time lineage fact, never
an authority/Canon decision — future artifacts reference a record via a
`ProvenanceRef` instead of embedding or being embedded by it. See
`docs/architecture/provenance-foundation.md` for the full model and
terminology, and `docs/architecture/adr/0014-*.md` for the governing
decisions.

This package does **not** implement a durable, queryable Provenance
Ledger, parent-existence validation, cross-record cycle detection, the
Canon Ledger, the Creation Graph engine, the Spark Engine, persistence,
AI invocation, or any product API/UI logic — see
`docs/architecture/provenance-foundation.md`, "Intentionally Deferred".
See `docs/architecture/CONSTITUTION.md` and the ADRs in
`docs/architecture/adr/` for the reasoning behind this boundary.
