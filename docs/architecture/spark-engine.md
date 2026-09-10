# Spark Engine (Directive 005)

Status: Implemented (foundational only). Package: `@cios/application`
(`packages/application/src/spark`).

This document describes the foundational Spark Engine — the immutable,
raw-inspiration capture layer for CIOS. It does **not** describe the
future Interpretation Engine, Creation Graph, Canon Ledger, Story
Genome, or any system that will eventually _consume_ Sparks to build
interconnected creative meaning.

## Core Modeling Principle

A `Spark` is the smallest possible unit of captured creative
inspiration — a raw fragment, exactly as the creator (or an imported
external reference) supplied it, with a record of where it came from.
It is deliberately **not**:

- a `CreativeEntity` (a `Character`, `Location`, `CreativeObject`,
  `Faction`, `CreativeEvent`, `Concept`, `Theme`, or `Rule`) — it has no
  `entityId`/`entityKind`.
- Canon — it carries no `canon`/`canonState`/`approved`/`confidence`
  field.
- interpreted, summarized, tagged, transcribed, OCR'd, or embedded — it
  has no `interpretation`/`transcript`/`ocr`/`tags`/`embedding`/
  `summary`/`title` field. Turning a raw Spark into any of these is the
  job of a future Interpretation Engine, not this layer.
- editable or deletable in place — it has no `updatedAt` or
  `lifecycleState`; a `Spark` is a single immutable point-in-time
  capture fact, exactly as `ProvenanceRecord` (Directive 004) is a
  single immutable point-in-time lineage fact.
- a container for more than one atomic piece of raw material — a
  `Spark` carries exactly one `SparkSource`, never an array or bundle
  of sources. Multiple fragments captured together are multiple
  Sparks.

## Vocabulary

### `SparkId`

A branded (nominal) UUID v4 string identifying exactly one `Spark`,
following the same branding strategy ADR 0013 established for
`UniverseId`/`WorkId`/`EntityId` and ADR 0014 extended for
`ProvenanceId`: a `string` intersected with its own private `unique
symbol`, never mutually assignable with any domain or provenance
identifier at compile time even though all are structurally UUID v4
strings at runtime. `createSparkId(raw)` validates a caller-supplied
string; `generateSparkId()` generates one via
`globalThis.crypto.randomUUID()` (no `node:crypto`, no `Math.random`
fallback); `isSparkId` is the runtime type guard.

### `SparkRef`

`{ universeId: UniverseId, sparkId: SparkId }` — an immutable, frozen
pointer to exactly one `Spark`, following the same shape and intent as
`ProvenanceRef`. Future artifacts that need to point at a Spark (an
Interpretation Engine output, a Creation Graph node) do so via a
`SparkRef`, never by embedding the full `Spark`.

### `SparkModality`

An exact 5-value union: `text`, `voice`, `image`, `link`, `file`. No
synonym (`mixed`, `ai`, `other`, `generated`) is ever accepted.

### `SparkSource`

A discriminated union, keyed by `modality`, of exactly one raw
inspiration payload per `Spark`:

| Modality | Shape                                                  | Notes                                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `text`   | `{ modality: 'text', content: string }`                | `content` is stored byte-for-byte exact — never trimmed, normalized, or otherwise transformed. Only rejects empty/whitespace-only input.                                                                                      |
| `voice`  | `{ modality: 'voice', resourceRef: SparkResourceRef }` | Opaque reference to a future voice asset. No transcription happens here.                                                                                                                                                      |
| `image`  | `{ modality: 'image', resourceRef: SparkResourceRef }` | Opaque reference to a future image asset. No OCR/vision happens here.                                                                                                                                                         |
| `link`   | `{ modality: 'link', url: string }`                    | `url` is stored exactly as supplied (leading/trailing whitespace preserved). Only `http:`/`https:` URLs validate; validation trims a local view of the string, but the stored value is never trimmed or otherwise normalized. |
| `file`   | `{ modality: 'file', resourceRef: SparkResourceRef }`  | Opaque reference to a future file asset. No filesystem access happens here.                                                                                                                                                   |

### `SparkResourceRef`

An opaque, branded, non-empty string identifying a future voice/image/
file asset by reference only. Because it is a technical locator rather
than creative content, surrounding whitespace is normalized (unlike
`text`/`link`, whose exact values are creative content and are never
altered).

### `Spark`

```
{
  sparkId: SparkId
  universeId: UniverseId
  scope: EntityScope
  provenanceRef: ProvenanceRef
  capturedAt: UtcTimestamp
  source: SparkSource
}
```

Nothing else. In particular, a `Spark` never embeds the full
`ProvenanceRecord` it was captured with — only a `ProvenanceRef`,
mirroring the reference-not-embedding convention `ProvenanceRecord`
itself established for its own parent lineage.

## Capture API

`captureSpark({ sparkId?, scope, provenanceRecord, capturedAt?,
source })` is the single entry point that constructs a `Spark`:

- `sparkId` is generated if omitted, or revalidated if supplied.
- `scope` is revalidated through `@cios/domain`'s certified
  `createEntityScope`, never trusted as-is from the caller — this both
  proves the shape at runtime (defending against a caller that has
  bypassed TypeScript) and guarantees `spark.universeId ===
spark.scope.universeId` by construction.
- `provenanceRecord` must be a full, valid `ProvenanceRecord` (Directive
  004), but only a `ProvenanceRef` derived from it is stored. Raw Spark
  acquisition only accepts `creator-original` and `imported-reference`
  provenance types — every AI-involved type (`ai-interpretation`,
  `ai-suggestion`, `ai-expansion`, `ai-revision`, `hybrid`) is rejected,
  because turning material into a Spark and interpreting/generating
  material are different responsibilities. The record's `universeId`
  must match `scope.universeId`, or capture is rejected with a stable
  cross-universe error code.
- `capturedAt` is generated (as a fresh `UtcTimestamp`) if omitted, or
  revalidated if supplied.
- `source` must already be a valid `SparkSource` (constructed via
  `createSparkSource`).

The resulting `Spark` — and its `scope`, `source`, and `provenanceRef`
— are all `Object.freeze`d, and no caller-retained mutable reference
(the input `scope` or `source` object) can affect the captured `Spark`
after the fact.

## What Directive 005 deliberately does not implement

No Interpretation Engine, AI transcription/OCR/embeddings, Creation
Graph, Constellation Engine, Canon Ledger, Story Genome, Creator
Intent, Muse, AI invocation of any kind, persistence, repositories,
database access, API routes, product UI, authentication, billing,
Production Studios, or Adaptation Engine. Spark capture performs no
filesystem access and no network requests of any kind.

See `docs/architecture/adr/0015-spark-immutable-source-boundary.md`
for the full list of accepted architectural decisions and their
rationale.
