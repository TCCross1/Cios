# 0013. Branded Identifiers and Entity Subtype Discriminated Unions for the Creative Domain Kernel

## Status

Accepted (amended by Directive 003R — see "Amendment" below).

## Context

Directive 003 introduces the first foundational product-domain types in
`packages/domain`: `CreativeUniverse`, `CreativeWork`, and a family of
`CreativeEntity` subtypes (`Character`, `Location`, `CreativeObject`,
`Faction`, `CreativeEvent`, `Concept`, `Theme`, `Rule`). All of these
reference identifiers for other domain concepts (a `CreativeWork`
references a `UniverseId`; an `EntityRef` references a `UniverseId` and
an `EntityId`). Plain `string` identifiers would let a `WorkId` be passed
by mistake wherever a `UniverseId` is expected — a class of bug that is
easy to introduce as the domain grows and impossible for `tsc` to catch
with plain strings, since all such identifiers are structurally
identical.

Similarly, every `CreativeEntity` subtype shares an identity/scope/
lifecycle shape (`CreativeEntityIdentity`/`CreativeEntityLifecycle`) but
must never be constructible with a mismatched `kind` (e.g. a value that
claims `kind: 'character'` but was built by `createTheme`).

## Decision

1. **Branded (nominal) identifier types.** `UniverseId`, `WorkId`, and
   `EntityId` are each a `string` intersected with a distinct, unexported
   `unique symbol` brand
   (`packages/domain/src/ids/{universe-id,work-id,entity-id}.ts`). They
   are runtime UUID v4 strings (validated via a shared internal regex in
   `ids/id-format.ts`, generated via the portable Web Crypto API —
   `globalThis.crypto.randomUUID()`, accessed through a minimal
   structural type rather than Node's `node:crypto`; see "Amendment"
   below), but are not mutually assignable at compile time. Each module
   exports a `createXId(raw)` validator (throws `DomainValidationError`
   on a malformed string), a `generateXId()` generator, and an
   `isXId(value)` runtime type guard. No brand-stripping/unsafe-cast
   helper is exported — the only supported way to obtain a branded ID is
   validation or generation.

2. **Entity subtype via a fixed-literal generic + composition, not a
   single object with an optional-kind field.** `CreativeEntityIdentity<TKind
extends EntityKind>` (`packages/domain/src/entity/entity-identity.ts`)
   fixes `entityKind: TKind` (see "Amendment" below for the field-name
   correction). Each concrete entity subtype (e.g. `Character`)
   is declared as `interface Character extends
CreativeEntityIdentity<'character'>, CreativeEntityLifecycle { ... }`.
   Critically, every subtype's construction function (`createCharacter`,
   `createLocation`, ...) hardcodes its own kind literal when calling the
   shared internal `resolveEntityIdentity(kind, input)` helper and does
   **not** accept a caller-supplied `entityKind` in its input type at
   all. This makes "a Character claiming to be a Theme" unrepresentable
   through any supported construction API, both at compile time (the
   input type has no `entityKind` field to override) and at runtime
   (nothing reads a caller-supplied kind).

3. **`EntityScope` and `TemporalReference` are discriminated unions, not
   objects with optional fields.** `EntityScope` is `{ kind: 'universe',
universeId } | { kind: 'work', universeId, workId }` — never a single
   shape with an optional `workId`, so "work scope without a work" is
   unrepresentable. `TemporalReference` uses the same pattern across its
   four variants (`exact`/`textual`/`relative`/`unknown`).

## Consequences

- `tsc` rejects `const universeId: UniverseId = someWorkId;` at compile
  time (proven in `packages/domain/tests/type-safety.test.ts` via
  `@ts-expect-error`, verified for real by
  `packages/domain/tsconfig.tests.json` — see below).
- No new runtime dependency was added for identifiers (`node:crypto`) or
  for discriminated unions (native TypeScript).
- A new `packages/domain/tsconfig.tests.json` was introduced
  (`include: ["src", "tests"]`) and `packages/domain/package.json`'s
  `typecheck` script now runs both `tsconfig.json` and
  `tsconfig.tests.json`, because the existing per-package `tsconfig.json`
  files only `include: ["src"]` — without this, `@ts-expect-error`
  assertions in `tests/` would never actually be type-checked by `pnpm
typecheck` (Vitest's esbuild-based transform does not enforce
  `@ts-expect-error` correctness). This change is scoped to
  `packages/domain` only; no other package's typecheck script was
  changed.
- Every domain construction function throws a single shared
  `DomainValidationError` (never returns a partially-valid value or
  silently coerces bad input), keeping error handling uniform across the
  whole domain kernel.

## Amendment (Directive 003R)

Independent verification of the original Directive 003 implementation
identified defects that this ADR's decisions did not anticipate:

- **Identifier generation portability.** The original implementation
  generated IDs via `import { randomUUID } from 'node:crypto'`, coupling
  the domain package (which this ADR and `docs/architecture/CONSTITUTION.md`
  require to be framework/runtime-independent) to Node.js specifically.
  This is corrected: `ids/id-format.ts` now generates UUID v4 strings via
  `globalThis.crypto.randomUUID()`, accessed through a minimal structural
  type (`{ readonly randomUUID: () => string }`) rather than relying on
  ambient DOM/Node lib types, so the same code runs unmodified under
  Node.js, browsers, and other modern JavaScript runtimes that implement
  Web Crypto. No source file under `packages/domain/src` imports
  `node:crypto` (or any other `node:`-prefixed module) as of this
  amendment. Generation throws `DomainValidationError` rather than
  falling back to a non-cryptographically-secure generator if
  `globalThis.crypto.randomUUID` is unavailable.
- **Entity foundation field names.** The original `CreativeEntityIdentity`
  used the generic field names `id`, `kind`, and (on
  `CreativeEntityLifecycle`) `lifecycle`. These collided ambiguously with
  every other identifier-bearing/discriminated concept in the package
  (`EntityRef.kind`, `UniverseId`/`WorkId`/`EntityId` all informally
  called "id") and made call sites less self-documenting. They are
  corrected to `entityId`, `entityKind`, and `lifecycleState`
  respectively — decision 2 above and this ADR's other references reflect
  the corrected names. `EntityRef.kind` is deliberately left unchanged
  (it was already an unambiguous, previously-approved shape; see
  `docs/architecture/creative-domain-model.md`, "Entity Reference
  Strategy").
- **`EntityKind` literal correction.** `'creative-object'` is corrected to
  `'object'`, matching the plain, one-word naming convention already used
  by every other kind (`character`, `location`, `faction`, ...); only the
  `EntityKind` string literal changed — the TypeScript type name
  `CreativeObject` is unchanged, still avoiding a collision with
  JavaScript's built-in `Object`.
- **Runtime immutability.** Every value returned by a `createX`
  construction function in this package (branded IDs excepted, since they
  are plain strings) is now passed through `Object.freeze` before being
  returned, in addition to the compile-time `readonly` fields this ADR
  already established. This closes a gap the original implementation
  left open: `readonly` alone is a compile-time-only guarantee and does
  not prevent runtime mutation via an unchecked cast or plain JavaScript
  call site.

None of these amendments change the core decisions in this ADR (branded
identifiers, fixed-literal-generic entity subtypes, discriminated
unions) — they correct implementation defects within that design.

## Alternatives Considered

- **Plain `string` identifiers with naming-convention discipline only**:
  rejected — relies entirely on developer vigilance; provides no
  compiler protection, which the Directive explicitly asks for
  (`@ts-expect-error`-verifiable non-interchangeability).
- **A single `zod` (or similar) schema library for both branding and
  runtime validation**: rejected for this directive — would add a new
  runtime dependency where hand-written branded types and a small shared
  regex/`DomainValidationError` fully satisfy the requirement; dependency
  discipline favors zero new dependencies unless something cannot
  reasonably be hand-rolled. This can be revisited if schema validation
  needs grow substantially (e.g. wire-boundary parsing in `@cios/contracts`).
- **A single `CreativeEntity` object with an optional `kind` and
  per-kind optional fields on one shape**: rejected — this is the
  "single object with optional fields" anti-pattern the Directive
  explicitly warns against; it would make invalid kind/field
  combinations representable and defers all correctness to runtime
  checks that are easy to forget to call.

## What Would Justify Revisiting

- A later directive introduces a domain concept where hand-rolled branded
  types and manual validation become a maintenance burden significant
  enough to justify a schema-validation dependency (e.g. `@cios/contracts`
  needing to validate arbitrary wire payloads against many evolving
  shapes).
- A later directive needs identifiers with a different runtime
  representation (e.g. ULIDs) — that directive should evaluate changing
  the ID format, not necessarily the branding/discriminated-union
  strategy itself.
