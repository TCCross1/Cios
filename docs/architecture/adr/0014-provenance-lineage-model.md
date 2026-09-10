# 0014. Provenance Lineage Model: Immutable Lineage Records Separate from Canon/Authority

## Status

Accepted. Amended by Directive 004R (URL source-scheme restriction,
`ProvenanceContributorKind` rename, this filename).

## Context

CIOS's future authoritative creative state will be based on Canon Ledger +
Creation Graph + Story Genome + Creator Intent + provenance/version history
(`docs/architecture/CONSTITUTION.md`; Directive 001, section 3). Before any
of those systems exist, Directive 004 asks for the narrowest possible
foundation: a way to record WHERE a piece of creative material came from
and HOW it was derived, without asserting anything about whether that
material is true, approved, Canon, high-quality, or authoritative. AI
agents must reason against authoritative state; they must never become
authoritative state themselves (Directive 001, section 3) — a provenance
record that accidentally carried a `canon`/`approved`/`confidence` field
would let a lineage fact quietly masquerade as an authority decision.

`@cios/provenance` already existed as an architecture-only placeholder
(Directive 002), depending only on `@cios/domain` per
`docs/architecture/dependency-policy.json`. Directive 004 authorizes the
first real implementation inside that boundary.

## Decision

1. **`ProvenanceType` is a fixed, exact 7-value union**
   (`creator-original`, `ai-interpretation`, `ai-suggestion`,
   `ai-expansion`, `ai-revision`, `hybrid`, `imported-reference`) with no
   synonym acceptance (e.g. `creator`, `ai`, `canon`, `approved` are all
   rejected). Each value has a fixed, mechanically-enforced structural
   invariant over `contributors`/`parents`/`sources` — never a subjective
   judgment about quality or truth.

2. **`ProvenanceId` is a distinct branded type**, following the exact
   branding strategy ADR 0013 established for `UniverseId`/`WorkId`/
   `EntityId`: a `string` intersected with a private `unique symbol`, not
   shared with `@cios/domain`'s brands, so a `ProvenanceId` is never
   mutually assignable with a domain identifier at compile time even
   though both are structurally UUID v4 strings at runtime. Because
   `@cios/domain`'s UUID-format helpers are internal and not exported,
   `@cios/provenance` re-implements an equivalent private regex and
   `globalThis.crypto.randomUUID()`-based generator rather than importing
   them — no `node:crypto` dependency anywhere in the package.

3. **`ProvenanceRecord` has no `subject`/`subjectId`/`subjectType`/
   `resourceType`/`resourceId` field.** Directive 004 explicitly rejects a
   generic arbitrary-subject namespace. A record only knows its own
   `provenanceId` and `universeId`; any future artifact that needs to
   reference a provenance fact does so via a `ProvenanceRef` (`{
universeId, provenanceId }`) pointing at it, never the reverse.

4. **`ProvenanceRecord` has no `updatedAt`, `canon`, `isCanon`,
   `canonState`, `approved`, `confidence`, `quality`, `authority`,
   `content`, or `metadata` field.** A `ProvenanceRecord` is a
   single immutable point-in-time lineage fact (only `createdAt`), not a
   mutable-over-time resource and not an authority/Canon decision. This
   constitutional boundary is enforced by a dedicated structural
   regression test (`tests/absence-of-authority.test.ts`) rather than left
   implicit.

5. **Per-type structural invariants are mechanical, not evaluative**:
   `creator-original` requires ≥1 `creator` contributor and forbids any
   `ai` contributor; `ai-interpretation`/`ai-expansion`/`ai-revision`
   require ≥1 `ai` contributor, forbid any `creator` contributor, and
   require ≥1 parent; `ai-suggestion` has the same contributor rule but an
   optional parent; `hybrid` requires ≥1 of each contributor kind;
   `imported-reference` requires ≥1 external source and leaves
   contributors unconstrained (may be empty). These are shape checks over
   who/what/whence — never judgments about whether the material is good
   or Canon-worthy.

6. **Parent lineage is intentionally shallow.** A parent reference must
   share the record's `universeId`, must not equal the record's own
   `provenanceId` (no direct self-parent), and must not be duplicated
   within one record's `parents`. Parent _existence_ is not validated
   against any store, and indirect (multi-hop) cycles are not detected —
   both are explicitly out of scope for this foundation (Directive 004,
   section 41) and would require a graph/repository this package does not
   have.

7. **Duplicate contributors/sources are rejected outright, never silently
   deduplicated.** A duplicate is an exact match on `contributorKind` +
   normalized (trimmed) `contributorRef`, or `sourceKind` + normalized
   `locator`. A different `sourceKind` reusing the same locator string
   remains distinct.

8. **Runtime immutability, not just `readonly`.** `createProvenanceRecord`
   always constructs brand-new `ProvenanceContributorRef`/`ExternalSourceRef`/
   `ProvenanceRef` objects from caller input (never freezes the caller's
   own array/objects in place), then `Object.freeze`s the record and every
   nested array. This gives caller-reference isolation "for free" — later
   mutation of a caller's input array/object never affects an
   already-constructed record — the same pattern ADR 0013's Directive 003R
   amendment established for `@cios/domain`.

9. **`createdAt` reuses `@cios/domain`'s `UtcTimestamp` validation
   directly** (`isUtcTimestamp`/`createUtcTimestamp`/`nowAsUtcTimestamp`,
   already calendar-strict per ADR 0013's Directive 003R2 amendment) —
   calendar-impossible values like `2026-02-30T12:00:00.000Z` are rejected
   without duplicating any calendar-validation logic inside
   `@cios/provenance`. There is no `updatedAt`/timestamp-pair, so
   `@cios/domain`'s timestamp-pair ordering resolver does not apply here.

10. **All construction functions throw the shared `DomainValidationError`**
    imported directly from `@cios/domain` (not duplicated), using a
    `provenance_record.*` / `provenance_id.*` / `provenance_contributor.*` /
    `provenance_ref.*` / `external_source_ref.*` dot-notation error-code
    scope consistent with `@cios/domain`'s existing convention
    (`entity_ref.entity_kind_invalid`, etc.). Codes are the stable machine
    contract; human-readable messages are not treated as part of that
    contract.

11. **`packages/provenance/tsconfig.tests.json`** (`include: ["src",
"tests"]`) was added, and `packages/provenance/package.json`'s
    `typecheck` script now runs both `tsconfig.json` and
    `tsconfig.tests.json`, mirroring the fix ADR 0013 documents for
    `@cios/domain` — otherwise `@ts-expect-error` assertions in
    `tests/type-safety.test.ts` and elsewhere would never actually be
    checked by `pnpm typecheck`.

12. **(Directive 004R) `sourceKind: "url"` locators must be absolute
    `http:`/`https:` web-reference URLs**, checked by parsing with the
    platform `URL` constructor and comparing `.protocol` exactly against
    an `http:`/`https:` allow-list — never a `startsWith`-style
    string-prefix check, which can misclassify malformed values. Schemes
    such as `javascript:`, `data:`, `file:`, `ftp:`, and `mailto:` are
    rejected for `sourceKind: "url"`. This is deterministic locator
    validation only: it performs no DNS, network, fetch, or
    content-safety check, and a successfully-validated `url` locator is
    not thereby known to be safe, trustworthy, or reachable. No alias or
    backward-compatibility scheme was retained. No broader URL
    canonicalization (default ports, trailing-slash semantics, hostname
    case, query-parameter order, fragments, percent-encoding) was
    introduced; those remain separate, deliberately deferred
    canonicalization questions that could affect provenance
    identity/duplicate semantics. `file`, `publication`, and `other`
    locators remain unaffected opaque, trimmed, non-empty strings.

13. **(Directive 004R) The public contributor-classification type is
    named `ProvenanceContributorKind`** (`'creator' | 'ai'`), not the
    previously-used `ContributorKind` — no backward-compatible alias was
    retained, since there are no production downstream consumers. The
    `contributorKind` field name is unchanged. Contributor classification
    is **provider-independent**: `ProvenanceContributorKind` only
    distinguishes a human creator from an AI contribution in the
    abstract; it never encodes a specific AI vendor, model, or provider
    identity, and `contributorRef` remains an opaque, unresolved
    identifier.

14. **Every `ProvenanceRecord` (and its nested `ProvenanceContributorRef`/
    `ExternalSourceRef`/`ProvenanceRef` values) is JSON-safe** — every
    field is a plain string, branded string, or a `readonly` array/object
    composed of those — and **runtime-frozen** (`Object.freeze`, not just
    a `readonly` compile-time annotation) at construction, in addition to
    caller-reference isolation (item 8, above).

15. **No durable persistence ledger, and no hash chain / Merkle tree /
    cryptographic lineage chain, exists yet.** `@cios/provenance` records
    a single immutable point-in-time lineage fact in memory; it does not
    persist records, does not chain records together cryptographically,
    and does not compute or verify any hash over a record or its
    ancestry. A durable, queryable, tamper-evident Provenance Ledger —
    and any hash-chain/Merkle-tree lineage-integrity mechanism it might
    need — is explicitly deferred to a future Provenance Ledger
    directive; this ADR does not design it in advance.

## Consequences

- `@cios/provenance` gains real behavior for the first time, still
  depending only on `@cios/domain` (`docs/architecture/dependency-policy.json`
  unchanged).
- No Spark Engine, Interpretation Engine, Canon Ledger, Creation Graph
  engine, Story Genome, Creator Intent, persistence, repositories,
  database, product API/UI, authentication, or AI invocation is
  introduced by this ADR or Directive 004 — this package remains a
  pure, framework-independent value-object/validation library.
- Zero new runtime dependencies were added.
- A future Canon Ledger / Creation Graph will consume `ProvenanceRef`s to
  point at lineage facts recorded here, but this ADR does not define how
  or when that consumption happens — that is deliberately deferred to a
  later directive.

## Alternatives Considered

- **A single `subject`/`subjectId` field on `ProvenanceRecord`, generic
  over any future artifact type**: rejected — Directive 004 explicitly
  forbids a generic arbitrary-subject namespace; it would let this
  foundation quietly grow into a de facto content/authority registry
  before Canon Ledger exists to own that responsibility.
- **Reusing `@cios/domain`'s ID brand symbols for `ProvenanceId`**:
  rejected — would make `ProvenanceId` structurally assignable to/from
  domain identifiers wherever the brand happened to be re-exported,
  undermining the same non-interchangeability guarantee ADR 0013
  establishes for domain identifiers.
- **Silently deduplicating repeated contributors/sources instead of
  rejecting them**: rejected — Directive 004 explicitly requires
  rejection; silent deduplication could hide a caller's mistaken belief
  that two distinct contributions were both recorded.
- **Implementing parent-existence validation or cycle detection now**:
  rejected — both require a graph or repository this foundation
  intentionally does not have yet; adding them now would implicitly
  design a piece of the future Creation Graph inside a package that must
  stay a plain, storage-independent value-object library.

## What Would Justify Revisiting

- A later directive introduces the Canon Ledger or Creation Graph and
  needs `ProvenanceRecord`s to be validated against a real store (parent
  existence, cross-record cycle detection) — that validation belongs in
  that later system, consuming `ProvenanceRef`s, not inside
  `@cios/provenance` itself.
- A later directive discovers a genuine need for `@cios/provenance` to
  depend on a package beyond `@cios/domain` — that would require an
  explicit `docs/architecture/dependency-policy.json` change and a new
  ADR amendment, not a silent addition.
