# 0015. Spark Engine: Immutable Raw Inspiration Capture

## Status

Accepted.

## Context

Directive 001 establishes that CIOS's future authoritative creative
state will be based on Canon Ledger + Creation Graph + Story Genome +
Creator Intent + provenance/version history, and that AI agents reason
against authoritative state without ever becoming it. Directive 004
built the narrowest possible provenance/lineage foundation
(`@cios/provenance`) for that future state. Before any Interpretation
Engine, Creation Graph, or Canon Ledger can exist, CIOS needs the
narrowest possible way to capture a raw fragment of human inspiration —
exactly as supplied, with a record of where it came from — without
prematurely interpreting, tagging, summarizing, or promoting it to
Canon. Directive 005 authorizes that foundation: the Spark Engine,
implemented inside the already-existing `@cios/application` package
boundary (Directive 002), which already depends on `@cios/domain` and
`@cios/provenance` per `docs/architecture/dependency-policy.json` — no
policy change was required.

## Decision

1. **`Spark` lives in `@cios/application` (`src/spark`), not a new
   workspace package.** `@cios/application` was already positioned with
   exactly the right `dependency-policy.json` allowances
   (`@cios/domain`, `@cios/provenance`), so no dependency-policy change
   was needed.

2. **`SparkId` is a distinct branded type**, following the exact
   branding strategy ADR 0013 established for `UniverseId`/`WorkId`/
   `EntityId` and ADR 0014 extended for `ProvenanceId`: a `string`
   intersected with its own private `unique symbol`, not shared with
   any other package's brand, so it is never mutually assignable with a
   domain or provenance identifier at compile time even though all are
   structurally UUID v4 strings at runtime. `@cios/application`
   re-implements its own private UUID-v4 regex and
   `globalThis.crypto.randomUUID()`-based generator rather than
   importing another package's internal helper — no `node:crypto`
   dependency, no `Math.random` fallback.

3. **`SparkRef` is `{ universeId, sparkId }`, nothing else** — the same
   shape and intent as `ProvenanceRef`: an immutable, frozen pointer,
   never a container for a Spark's content.

4. **`Spark` reuses `@cios/domain`'s `EntityScope`** rather than
   inventing a parallel scope concept. `captureSpark` revalidates the
   caller-supplied scope through the certified `createEntityScope`
   function rather than trusting an arbitrary caller object — this both
   defends against a caller that has bypassed TypeScript and guarantees
   `spark.universeId === spark.scope.universeId` by construction (both
   are derived from the same freshly-validated scope).

5. **A `Spark` carries exactly one atomic `SparkSource`**, never an
   array or bundle. `SparkModality` is a fixed, exact 5-value union
   (`text`, `voice`, `image`, `link`, `file`) with no synonym accepted
   (`mixed`, `ai`, `other`, `generated` are all rejected). Capturing
   multiple fragments together means capturing multiple Sparks.

6. **Text and link source values are preserved exactly, byte-for-code-
   unit, with no trim/normalization of the stored value.** Validation
   may inspect a locally-trimmed view to decide acceptance (rejecting
   empty/whitespace-only text, or a malformed URL), but the field
   actually stored on the constructed `SparkSource` is always the
   caller's original, untouched string. This is a deliberate divergence
   from `ProvenanceRecord`'s `ExternalSourceRef`, whose `locator` is
   trimmed — a Spark's raw text/link **is** the creative content being
   captured, whereas a provenance locator is a technical pointer.

7. **`SparkResourceRef` is an opaque, non-empty, branded string** for
   `voice`/`image`/`file` sources. Unlike `text`/`link`, its surrounding
   whitespace is normalized, because it is a technical locator for a
   future asset, not creative content itself. No filesystem or network
   access happens anywhere in Spark construction or capture — an actual
   voice/image/file asset is a future concern for a storage/ingestion
   layer this ADR does not design.

8. **Link validation reuses provenance's `http:`/`https:`-only
   semantics (ADR 0014, item 12), reimplemented rather than imported.**
   `@cios/provenance`'s equivalent check (`hasAllowedUrlProtocol` in
   `external-source-ref.ts`) is an internal, unexported module helper —
   not part of that package's public API, and its public
   `createExternalSourceRef` trims-and-stores its locator, which is
   incompatible with Spark's raw-preservation requirement (item 6).
   `@cios/application` therefore re-implements an equivalent private
   helper (parsing with the platform `URL` constructor and comparing
   `.protocol` exactly against an `http:`/`https:` allow-list — never a
   `startsWith` check), the same self-contained-reimplementation pattern
   already established for UUID-format helpers across
   `@cios/domain`/`@cios/provenance`.

9. **`Spark` has exactly six fields — `sparkId`, `universeId`, `scope`,
   `provenanceRef`, `capturedAt`, `source` — and nothing else.** In
   particular it has no `updatedAt` or `lifecycleState` (it is a single
   immutable point-in-time capture fact, not a mutable resource, the
   same principle ADR 0014 established for `ProvenanceRecord`), no
   `title`/`summary`/`interpretation`/`transcript`/`ocr`/`tags`/
   `embedding` (interpretation is a future Interpretation Engine's job,
   never this layer's), no `entityId`/`entityKind` (a Spark is not a
   `CreativeEntity`), and no `canon`/`canonState`/`approved`/
   `confidence` (a Spark is not a Canon decision). This constitutional
   boundary is enforced by a dedicated structural regression test
   (`tests/spark-structural-absence.test.ts`) rather than left implicit.

10. **A full, valid `ProvenanceRecord` is required at capture time, but
    only a `ProvenanceRef` derived from it is stored on the `Spark` —
    never the embedded record.** `captureSpark` independently
    revalidates the three facts it actually needs from the caller's
    `provenanceRecord` (`provenanceType` membership, `universeId`
    equality against `scope.universeId`) and then calls
    `@cios/provenance`'s own certified `createProvenanceRef` to
    re-derive and re-validate the stored reference — it does not
    duplicate `@cios/provenance`'s full record validator, and an
    adversarial runtime-malformed `provenanceRecord` object (one that
    bypassed TypeScript) cannot produce a malformed stored `SparkRef`
    or `ProvenanceRef` as a result.

11. **Raw Spark acquisition only accepts `creator-original` and
    `imported-reference` provenance types.** Every AI-involved
    `ProvenanceType` (`ai-interpretation`, `ai-suggestion`,
    `ai-expansion`, `ai-revision`, `hybrid`) is rejected with a stable
    `spark_capture.provenance_type_not_permitted` error code — turning
    material into a Spark (raw acquisition) and AI
    interpreting/suggesting/expanding/revising material are different
    responsibilities that must never be conflated at this boundary. A
    `provenanceRecord` whose `universeId` does not match the capture
    `scope`'s `universeId` is rejected with a stable
    `spark_capture.cross_universe_provenance` error code, regardless of
    how otherwise-valid that record is.

12. **Runtime immutability, not just `readonly`.** `captureSpark`
    always constructs a brand-new `Spark`/`SparkSource`/`SparkRef` from
    caller input (never freezes or reuses the caller's own object in
    place), then `Object.freeze`s the result and its nested `scope` and
    `source`. This gives caller-reference isolation for free — later
    mutation of a caller's input `scope`/`source` object never affects
    an already-captured `Spark` — the same pattern ADR 0013 and ADR 0014
    established for `@cios/domain` and `@cios/provenance`. Every `Spark`
    and its nested values are also JSON-safe (plain strings, branded
    strings, and `readonly` objects composed of those).

13. **`capturedAt` reuses `@cios/domain`'s `UtcTimestamp` validation
    directly** (`isUtcTimestamp`/`createUtcTimestamp`/
    `nowAsUtcTimestamp`, already calendar-strict per ADR 0013's
    Directive 003R2 amendment) — calendar-impossible values like
    `2026-02-30T12:00:00.000Z` are rejected without duplicating any
    calendar-validation logic inside `@cios/application`.

14. **All construction functions throw the shared
    `DomainValidationError`** imported directly from `@cios/domain` (not
    duplicated), using a `spark_id.*` / `spark_ref.*` / `spark_modality.*`
    / `spark_resource_ref.*` / `spark_source.*` / `spark_capture.*`
    dot-notation error-code scope consistent with the existing
    `@cios/domain`/`@cios/provenance` convention. Codes are the stable
    machine-readable contract; human-readable messages are not.

15. **`packages/application/tsconfig.tests.json`** (`include: ["src",
    "tests"]`) was added, and `packages/application/package.json`'s
    `typecheck` script now runs both `tsconfig.json` and
    `tsconfig.tests.json`, mirroring the fix ADR 0013/0014 document for
    `@cios/domain`/`@cios/provenance` — otherwise `@ts-expect-error`
    assertions in the Spark test suite would never actually be checked
    by `pnpm typecheck`.

## Consequences

- `@cios/application` gains real behavior for the first time, still
  depending only on `@cios/domain` and `@cios/provenance`
  (`docs/architecture/dependency-policy.json` unchanged).
- No Interpretation Engine, AI transcription/OCR/embeddings, Creation
  Graph engine, Constellation Engine, Canon Ledger, Story Genome,
  Creator Intent, Muse, AI invocation of any kind, persistence,
  repositories, database access, product API routes, product UI,
  authentication, billing, Production Studios, or Adaptation Engine is
  introduced by this ADR or Directive 005.
- Zero new runtime dependencies were added.
- A future Interpretation Engine will consume `SparkRef`s (and read
  captured `Spark`s) to produce structured proposals, but this ADR does
  not define how or when that consumption happens — that is
  deliberately deferred to a later directive.

## Alternatives Considered

- **Creating a new `@cios/spark` workspace package**: rejected — Spark
  Engine's dependency needs (`@cios/domain`, `@cios/provenance`) were
  already exactly satisfied by the existing `@cios/application`
  placeholder from Directive 002; a new package would add
  `dependency-policy.json` surface area with no corresponding benefit.
- **Reusing `@cios/domain`'s or `@cios/provenance`'s ID brand symbols
  for `SparkId`**: rejected — would make `SparkId` structurally
  assignable to/from those identifiers wherever the brand happened to
  be re-exported, undermining the same non-interchangeability guarantee
  ADR 0013/0014 establish.
- **Allowing a `Spark` to carry multiple `SparkSource`s (a bundle)**:
  rejected — Directive 005 explicitly requires one atomic source per
  Spark; a bundling concept, if ever needed, belongs to a future
  Creation Graph or collection concept, not this capture primitive.
- **Trimming/normalizing `text`/`link` source values the way
  `ExternalSourceRef.locator` is trimmed**: rejected — a Spark's raw
  text/link is the creative content itself, not a technical pointer;
  silently altering it would violate Directive 005's exact-preservation
  requirement and could discard a creator's deliberate formatting.
- **Allowing AI-derived provenance types (`ai-interpretation`, etc.) to
  be captured as Sparks**: rejected — Directive 005 explicitly restricts
  raw Spark acquisition to `creator-original`/`imported-reference`;
  admitting AI-derived types would blur the acquisition/interpretation
  boundary Directive 001 requires CIOS to keep sharp.
- **Storing the full `ProvenanceRecord` on `Spark` instead of a
  `ProvenanceRef`**: rejected — mirrors the same reference-not-embedding
  rationale ADR 0014 already established for provenance's own parent
  lineage; embedding would duplicate data and make later provenance
  corrections (a new record, never an edit) inconsistent with what a
  Spark had stored.
- **Duplicating `@cios/provenance`'s full `ProvenanceRecord` validator
  inside `@cios/application`**: rejected — `captureSpark` only
  revalidates the specific facts it needs and delegates reference
  construction to `@cios/provenance`'s own certified `createProvenanceRef`,
  avoiding two independently-maintained copies of the same validation
  logic drifting apart.

## What Would Justify Revisiting This ADR

- A future Interpretation Engine directive needing a stable way to
  reference and read raw Sparks in bulk (may motivate persistence/
  repository concerns explicitly deferred here).
- A future need for a Spark to carry more than one atomic source (would
  require a deliberate new bundling concept, not a change to this
  atomic model).
- A future need for additional `SparkModality` values (e.g. video) —
  would extend the exact union deliberately, not loosen it.
