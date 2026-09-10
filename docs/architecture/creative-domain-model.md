# Creative Domain Model (Directive 003, corrected by Directive 003R)

Status: Implemented (foundational only), remediated. Package: `@cios/domain`
(`packages/domain/src`).

This document describes the foundational Creative Domain Kernel — the
deterministic, framework/persistence/AI-independent vocabulary that later
CIOS systems (Canon Ledger, Spark Engine, Creation Graph, Story Genome,
...) will build on. It does **not** describe any of those later systems.

Directive 003R corrected several defects found during independent
verification of the original Directive 003 implementation: the
`CreativeFormat` vocabulary, the `object` `EntityKind` literal, missing
`updatedAt`/`lifecycleState` on `CreativeUniverse`/`CreativeWork`,
non-canonical entity foundation field names, missing `displayName`/
timestamps on entity subtypes, no runtime immutability, and a
Node-only `node:crypto` import. This document reflects the corrected,
current model — it does not describe the original, defective shapes.

## Core Modeling Principle

Every domain concept in this kernel is understood along separated
concerns, so no single directive collapses them into one ambiguous shape:

- **IDENTITY** — what something is and where it is addressable
  (`CreativeEntityIdentity`: `entityId`, `universeId`, `entityKind`,
  `scope`, `displayName`).
- **CONTENT** — the concept's descriptive substance (`name`,
  `description`, subtype-specific fields like `Character.aliases`).
- **STATE** — its ordinary lifecycle and audit timestamps
  (`CreativeEntityLifecycle`: `lifecycleState`, `createdAt`,
  `updatedAt`), explicitly distinct from future Canon authority.
- **SCOPE** — its addressability boundary (`EntityScope`: universe-wide
  or work-scoped).
- **REFERENCE** — how one concept points at another without embedding it
  (`EntityRef`).
- **TEMPORAL** — when something occurs in-universe (`TemporalReference`),
  distinct from narrative position (see below).
- **PROVENANCE** — not modeled in this directive; a future concern (ADR
  0007).
- **PRESENTATION** — not modeled in this directive.

## Terminology

| Term               | Meaning                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| Creative Universe  | The top-level creative container; everything else belongs to exactly one.                                  |
| Creative Work      | A specific work (novel, film, season, ...) belonging to exactly one universe.                              |
| Creative Format    | The closed set of supported work formats.                                                                  |
| Creative Entity    | The foundational identity+lifecycle shape every entity subtype composes with.                              |
| Entity Kind        | The closed, discriminant tag identifying which entity subtype a value is.                                  |
| Entity Scope       | Whether an entity belongs to an entire universe or one specific work within it.                            |
| Entity Ref         | A lightweight, serializable pointer to an entity (universe + entity id + kind), not an embedded copy.      |
| Lifecycle State    | An entity's/universe's/work's ordinary draft/active/archived state — never Canon authority.                |
| Display Name       | An entity's canonical, generic display string — always identical to its subtype-specific name/title field. |
| Temporal Reference | When an event occurs in-universe: exact/textual/relative/unknown.                                          |
| Narrative Position | (Deferred — see below.) When the audience encounters something, as opposed to when it occurs.              |

## Creative Universe

`packages/domain/src/universe/creative-universe.ts`

```
CreativeUniverse {
  id: UniverseId; name: string; description?: string;
  createdAt: UtcTimestamp; updatedAt: UtcTimestamp; lifecycleState: LifecycleState;
}
```

Invariants: `name` must be non-empty after trimming; `id` is generated if
omitted, otherwise validated; `createdAt` is generated (`nowAsUtcTimestamp()`)
if omitted, otherwise validated (a pre-branded `UtcTimestamp` is still
re-validated, not bypassed; a plain string is parsed and validated).
`updatedAt` defaults to `createdAt` when omitted, and is rejected if it
would precede `createdAt`. `lifecycleState` defaults to `'draft'`. The
returned value is frozen (`Object.freeze`) — see "Immutability /
Serialization" below.

## Creative Work

`packages/domain/src/work/creative-work.ts`

```
CreativeWork {
  id: WorkId; universeId: UniverseId; title: string; format: CreativeFormat;
  description?: string; createdAt: UtcTimestamp; updatedAt: UtcTimestamp;
  lifecycleState: LifecycleState;
}
```

`universeId` is a required field (compile-time enforced; also validated
at runtime). `title` must be non-empty after trimming. `format` must be a
supported `CreativeFormat`. `updatedAt`/`lifecycleState` follow the same
defaulting/ordering/validation rules as `CreativeUniverse`. The returned
value is frozen.

## Creative Format

`packages/domain/src/format/creative-format.ts`

A closed union of exactly 11 values: `'novel' | 'feature-film' |
'television-series' | 'sitcom' | 'animation' | 'narrative-game' |
'role-playing-game' | 'graphic-narrative' | 'audio' | 'interactive' |
'other'`.

The obsolete literals `'television'` and `'rpg'` (used by the original,
defective Directive 003 implementation) are **not** valid `CreativeFormat`
values and are rejected by `isCreativeFormat`/`assertCreativeFormat`; no
alias/compatibility mapping exists for them.

**Extension strategy**: adding a new format is a deliberate, reviewed
change to this literal union (and `isCreativeFormat`/
`assertCreativeFormat`) in a future directive — it is not
data-driven/open-ended, so every consumer that switches on `CreativeFormat`
is forced by `tsc` to handle new formats explicitly.

## Creative Entity Foundation

`packages/domain/src/entity/{entity-kind,entity-scope,entity-ref,entity-identity}.ts`

- `EntityKind`: closed union of the 8 implemented kinds (see below).
- `CreativeEntityIdentity<TKind extends EntityKind>`: `{ entityId: EntityId;
universeId: UniverseId; entityKind: TKind; scope: EntityScope;
displayName: string }`.
- `CreativeEntityLifecycle`: `{ lifecycleState: LifecycleState; createdAt:
UtcTimestamp; updatedAt: UtcTimestamp }`.

These are the corrected, canonical field names. The obsolete names `id`,
`kind`, and `lifecycle` used by the original implementation are not part
of the public `CreativeEntity` contract (verified by compile-time
assertions in `packages/domain/tests/type-safety.test.ts`).

`universeId` is exposed as a top-level field in addition to
`scope.universeId`: the caller supplies only `scope`, and `universeId` is
deterministically _derived_ from `scope.universeId` — there is no
separate, independently suppliable `universeId` input, so the two can
never contradict each other. `displayName` is likewise always derived
from the same normalized value a subtype uses for its own semantic field
(`Character.name`, `CreativeEvent.title`, ...) — never an independently
suppliable value.

Each concrete entity subtype (`Character`, `Location`, ...) is declared as
`interface X extends CreativeEntityIdentity<'x'>, CreativeEntityLifecycle { ...content }`.
Every subtype's `createX` function hardcodes its own kind literal
internally (via the shared, module-internal `resolveEntityIdentity`
helper) and does not accept a caller-supplied `entityKind` — an entity can
never misidentify its own subtype, at compile time (no `entityKind` field
to override) or at runtime (nothing reads a caller-supplied kind).

`resolveEntityIdentity` also freezes its returned identity object and a
defensive copy of the caller-supplied `scope` (so a caller retaining a
reference to the original `scope` object cannot mutate an already-
constructed entity's scope afterward).

## Entity Kind Decisions

**Included** (foundational, directive-required): `character`, `location`,
`object`, `faction`, `event`, `concept`, `theme`, `rule`.

The literal is `'object'`, not `'creative-object'` — the obsolete
`'creative-object'` literal used by the original implementation is
rejected by `isEntityKind`. The TypeScript _type/interface name_
`CreativeObject` is unchanged (only the `EntityKind` string literal
value changed) — the type name avoids colliding with JavaScript's
built-in `Object`, while the literal value follows the same plain,
one-word naming convention as every other kind.

**Deliberately deferred** (not implemented; no fake/placeholder
implementation exists): `organization` (see Faction/Organization
decision below), and any kind belonging to a later system (e.g. a
`spark` kind, a `canon-fact` kind).

## Character

`packages/domain/src/character/character.ts`

```
Character extends CreativeEntityIdentity<'character'>, CreativeEntityLifecycle {
  name: string; aliases: readonly string[]; description?: string;
}
```

`name` is always identical to `displayName`. Aliases: each is trimmed; an
empty-after-trim alias is rejected (fails closed rather than silently
dropping); exact-duplicate aliases are removed, preserving
first-occurrence order; case is **never folded** (aliases are
case-sensitive proper nouns — e.g. "Doc" and "DOC" may be meaningfully
different in-universe). The returned `aliases` array is always a fresh,
frozen copy — the caller's original array (if any) is never retained by
reference, so mutating it after construction never affects the
constructed `Character`.

Deliberately not implemented: Character Consciousness, psychology/goals/
secrets models, relationship graphs, AI-generated personality, character
timelines.

## Location

`packages/domain/src/location/location.ts`

```
Location extends CreativeEntityIdentity<'location'>, CreativeEntityLifecycle {
  name: string; description?: string; parentLocationId?: EntityId;
}
```

`name` is always identical to `displayName`. A location is valid with no
parent. Only the local invariant "a Location may not directly parent
itself" is enforced (`parentLocationId === entityId`); full
hierarchy-cycle detection requires graph/repository context beyond a
single value and is out of scope for this directive.

## Creative Object

`packages/domain/src/creative-object/creative-object.ts`

```
CreativeObject extends CreativeEntityIdentity<'object'>, CreativeEntityLifecycle {
  name: string; description?: string;
}
```

`entityKind` is the required literal `'object'` (not `'creative-object'`).
`name` is always identical to `displayName`. The TypeScript type is named
`CreativeObject`, not `Object`, to avoid colliding with JavaScript's
built-in `Object`. Deliberately not implemented: ownership history,
inventory, physical simulation, artifact provenance.

## Faction / Organization Decision

`packages/domain/src/faction/faction.ts`

Directive 003 implements **only `Faction`** — no separate `Organization`
kind exists. Rationale: at this foundational layer, "Faction" and
"Organization" have no materially different future behavior/identity
meaning yet; both represent a named group with shared identity,
allegiance, or purpose. `Faction`'s shape (identity, name, optional
description) makes no assumption about scale, moral alignment, or
narrative importance, so an ordinary/mundane organization (e.g. a bakery)
can be represented as a `Faction` today without becoming a `Concept`
dumping ground. If a later directive identifies a materially different
future need for organizations (e.g. distinct legal/corporate-structure
fields that would not make sense on a war-band or cult), that directive
can introduce `Organization` as its own first-class kind — this decision
does not preclude that. No fake/placeholder `Organization` type,
constructor, or `EntityKind` value exists anywhere in this package.
`name` is always identical to `displayName`.

## Creative Event

`packages/domain/src/event/creative-event.ts`

```
CreativeEvent extends CreativeEntityIdentity<'event'>, CreativeEntityLifecycle {
  title: string; description?: string; temporalReference?: TemporalReference;
}
```

`title` is always identical to `displayName`. An event is valid with no
temporal information at all (`temporalReference` is optional), and
separately may hold the `unknown` variant of `TemporalReference` when
timing is deliberately marked unresolved. Deliberately not implemented:
chronology engine, causal/event-dependency graph, Mystery Ledger truth,
character/audience knowledge of the event.

## Concept

`packages/domain/src/concept/concept.ts`

```
Concept extends CreativeEntityIdentity<'concept'>, CreativeEntityLifecycle {
  name: string; description?: string;
}
```

`name` is always identical to `displayName`. For abstract creative ideas
that are not themes, rules, objects, or any other more specific kind.
Deliberately kept minimal so it is not misused as a catch-all for
concepts that should instead get their own kind in a future directive.

## Theme

`packages/domain/src/theme/theme.ts`

```
Theme extends CreativeEntityIdentity<'theme'>, CreativeEntityLifecycle {
  name: string; description?: string;
}
```

`name` is always identical to `displayName`.

## Rule

`packages/domain/src/rule/rule.ts`

```
Rule extends CreativeEntityIdentity<'rule'>, CreativeEntityLifecycle {
  name: string; description?: string;
}
```

`name` is always identical to `displayName`.

**Rule carries no Canon-authority field or state.** A `Rule`'s shape is
identical in structure to `Concept`/`Theme` (identity + lifecycle + name

- optional description) — there is no `canon`, `isCanon`, or `authority`
  field anywhere on it. **A Rule's existence alone never implies Canon.**
  Canon (the future authoritative creative-truth system) is an entirely
  separate future concern (see "Intentionally Deferred Systems" below);
  this directive does not implement it, reference it, or give any domain
  type the ability to declare itself canonical.

## Lifecycle Model

`packages/domain/src/lifecycle/lifecycle-state.ts`

```
LifecycleState = 'draft' | 'active' | 'archived'
```

This is an **ordinary maturity/editing state** — not Canon authority, and
not a proxy for it. `draft` specifically means "still being actively
imagined/edited/reconsidered by its creator" — a mundane, expected point
in ordinary creative work, never a synonym for "unapproved Canon" or any
future Canon-adjacent vocabulary. It applies uniformly to
`CreativeUniverse`, `CreativeWork`, and every entity subtype. No lifecycle
value in this closed union is, or resembles, a Canon-authority state
(e.g. there is no `'locked_canon'`, `'canon'`, `'candidate'`, or similar
value — verified directly in `packages/domain/tests/lifecycle.test.ts`).
`resolveLifecycleState(undefined)` defaults to `'draft'`; resolving any
other string throws `DomainValidationError`. The future Canon Ledger (ADR 0007) will define its own, entirely separate versioned/provenance-tracked
state machine — it is not layered on top of, or derived from,
`LifecycleState`.

## Identifier Strategy

`packages/domain/src/ids/{universe-id,work-id,entity-id,id-format}.ts`

Each of `UniverseId`, `WorkId`, `EntityId` is a **branded (nominal)**
string type: `string & { readonly [brand]: true }` with a distinct,
unexported `unique symbol` brand per type, so structurally identical
branded types are not mutually assignable — a `WorkId` cannot be passed
where a `UniverseId` is required without an explicit, intentional cast.
See ADR 0013 for the full rationale.

- **Runtime format**: UUID v4 (validated via a shared internal regex).
- **Generation**: `generateXId()` uses the portable Web Crypto API
  (`globalThis.crypto.randomUUID()`, accessed through a minimal
  structural type in `ids/id-format.ts`) — **not** Node's `node:crypto`.
  No source file under `packages/domain/src` imports `node:crypto` (or
  any other `node:`-prefixed module), so ID generation works unmodified
  in any modern JavaScript runtime that implements Web Crypto (browsers,
  Node.js ≥ 19, Deno, Cloudflare Workers, ...), not only Node.js. If
  `globalThis.crypto.randomUUID` is unavailable, generation throws
  `DomainValidationError` rather than silently falling back to a
  non-cryptographically-secure generator (e.g. `Math.random()`).
- **Serialization**: a branded ID is a plain string at runtime, so
  `JSON.stringify`/`JSON.parse` round-trips it exactly as a string (the
  brand exists only in the type system and disappears after
  deserialization — a consumer must re-validate with `isXId`/`createXId`
  after crossing a real wire boundary, which this directive does not
  implement).

## Entity Reference Strategy

`packages/domain/src/entity/entity-ref.ts`

```
EntityRef { universeId: UniverseId; entityId: EntityId; entityKind: EntityKind }
```

`EntityRef.kind` was renamed to `EntityRef.entityKind` by Directive 003R2:
the original Directive 003 specification used `entityKind` for this
field, and no later authoritative directive explicitly superseded that
name. There is no backward-compatible `kind` alias — no production
downstream consumer of `@cios/domain` existed at the time of this
rename. `EntityScope.kind` and `TemporalReference.kind` (below) are
unaffected by this rename: they are legitimate discriminated-union tags,
not identity vocabulary, and remain named `kind`.

`universeId` is included alongside `entityId` — not merely `entityId`
alone — for the same isolation reasoning as `WorkEntityScope` (see
below): a reference's universe is always known without a lookup/join,
and a reference can never accidentally resolve into the wrong universe's
entity if two universes ever reuse comparable identifiers in some future
storage layer. `EntityRef` is a lightweight pointer only — it never
embeds the referenced entity's content. `createEntityRef` returns a
frozen value.

## Entity Scope Model

`packages/domain/src/entity/entity-scope.ts`

```
EntityScope =
  | { kind: 'universe'; universeId: UniverseId }
  | { kind: 'work'; universeId: UniverseId; workId: WorkId }
```

A discriminated union — never a single object with an optional `workId`
— so "work scope without a work" is unrepresentable. `WorkEntityScope`
includes `universeId` alongside `workId` for the same isolation reasoning
as `EntityRef` above. `createEntityScope` returns a frozen value.

## Temporal Model

`packages/domain/src/temporal/{utc-timestamp,temporal-reference}.ts`

```
TemporalReference =
  | { kind: 'exact'; timestamp: UtcTimestamp }
  | { kind: 'textual'; value: string }
  | { kind: 'relative'; label: string }
  | { kind: 'unknown' }
```

CIOS cannot assume Gregorian chronology or that every in-universe event
has a real-world-mappable date, so this is a closed, minimal
discriminated union rather than a single `Date`/timestamp field. No
chronology engine, causal graph, era system, or fictional-calendar date
arithmetic is implemented — only a minimal, validated shape per kind of
temporal knowledge. Every variant returned by `createTemporalReference` is
frozen.

`UtcTimestamp` requires **true calendar validity, not merely
parseability** (Directive 003R2). A candidate string must be both:

1. syntactically valid against the strict fixed-width ISO-8601 UTC
   pattern `YYYY-MM-DDTHH:mm:ss.sssZ`, and
2. semantically valid as the exact calendar instant it expresses —
   `new Date(input).toISOString() === input` must hold exactly.

JavaScript `Date` parsing silently normalizes calendar-impossible values
(e.g. `"2026-02-30T12:00:00.000Z"` becomes `"2026-03-02T12:00:00.000Z"`
internally) rather than rejecting them, so relying on `Date.parse`
returning a finite number alone is insufficient and was a prior defect.
Impossible dates (nonexistent month/day/hour/minute/second, e.g. Feb 30,
Feb 29 in a non-leap year, hour 24, minute 60, second 60) are always
**rejected**, never silently renormalized to a nearby valid date. Both
`createdAt` and `updatedAt` on every entity, `CreativeUniverse`, and
`CreativeWork` are validated through this same shared check — no
subtype bypasses it.

## Narrative Position Decision

**DEFERRED.** No `NarrativePosition` type or field is implemented in
Directive 003. Rationale: narrative position answers "when does the
audience encounter this" (e.g. episode 4, chapter 12) — a materially
different question from `TemporalReference`'s "when did this occur
in-universe". Any meaningful narrative-position value requires a
scene/chapter/episode ordering container (a structural concept of
`CreativeWork` composition) that Directive 003 explicitly does not
define. Introducing a placeholder now would either be meaningless (no
container to position against) or would prematurely commit to a
structure a later directive should design deliberately.

## Domain Validation / Error Model

`packages/domain/src/errors/domain-validation-error.ts`

A single `DomainValidationError extends Error` type is used by every
construction function in this package: `{ code: string; field?: string;
message: string }`. Every `createX`/`resolveX` function either returns a
fully valid value or throws `DomainValidationError` — it never returns a
partially valid value, never silently coerces or drops invalid input,
and never returns `null`/`undefined` in place of a validation failure.
This includes the `createdAt`/`updatedAt` ordering invariant (an
`updatedAt` earlier than `createdAt` is rejected, not silently
reordered/clamped) and every `lifecycleState` value.

## Immutability / Serialization

Every domain type is declared with `readonly` fields (and `readonly
string[]` for array fields, e.g. `Character.aliases`) at compile time —
but Directive 003R additionally enforces this **at runtime**: every value
returned by a `createX` construction function (`CreativeUniverse`,
`CreativeWork`, every entity subtype, `EntityScope`, `EntityRef`, every
`TemporalReference` variant) is passed through `Object.freeze` before
being returned, and `Character.aliases` is frozen as its own array
independent of the outer freeze. Because every module in this package is
an ES module (implicit strict mode), assigning to a frozen property
throws a `TypeError` rather than silently failing — verified directly in
`packages/domain/tests/*.test.ts`'s runtime immutability tests, not only
asserted via TypeScript's `readonly`.

Every domain type is plain, JSON-safe data (no class instances, no
functions, no `Map`/`Set`, no circular references) — `JSON.stringify`
followed by `JSON.parse` always recovers an equivalent plain object, and
`Object.freeze` does not interfere with `JSON.stringify` (see
`packages/domain/tests/serialization.test.ts`).

## Intentionally Deferred Systems

Directive 003 does **not** implement, reference, or leave placeholder
code for: Canon / Locked Canon / Canon Ledger, the Spark Engine, the
Creation Graph engine, the Story Genome, the Creator Intent Record,
provenance/version-history storage, persistence of any kind, AI/agent
logic, authentication/authorization, product API endpoints, product UI,
or any of the other systems listed in `docs/architecture/CONSTITUTION.md`
under long-term architecture. `LifecycleState` and `Rule` are
specifically designed so their existence cannot be mistaken for, or
silently promoted into, Canon authority (see "Lifecycle Model" and
"Rule" above).

## Public API Surface

`packages/domain/src/index.ts` is the package's curated public export
surface. Internal module-local helpers (e.g. `entity/entity-identity.ts`'s
`resolveEntityIdentity`, `entity/internal/display-text.ts`'s
`resolveDisplayText`, `ids/id-format.ts`'s UUID validator/generator,
`temporal/resolve-timestamp-pair.ts`'s `resolveTimestampPair`) are
deliberately not re-exported, so consumers depend on stable, deliberate
surface area rather than deep imports into implementation modules. None
of the obsolete field names (`id`, `kind`, `lifecycle` on the entity
foundation) or obsolete literal values (`'television'`, `'rpg'`,
`'creative-object'`) are exposed anywhere in this surface.
