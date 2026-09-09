# Creative Domain Model (Directive 003)

Status: Implemented (foundational only). Package: `@cios/domain`
(`packages/domain/src`).

This document describes the foundational Creative Domain Kernel — the
deterministic, framework/persistence/AI-independent vocabulary that later
CIOS systems (Canon Ledger, Spark Engine, Creation Graph, Story Genome,
...) will build on. It does **not** describe any of those later systems.

## Core Modeling Principle

Every domain concept in this kernel is understood along separated
concerns, so no single directive collapses them into one ambiguous shape:

- **IDENTITY** — what something is and where it is addressable
  (`CreativeEntityIdentity`: `id`, `kind`, `scope`).
- **CONTENT** — the concept's descriptive substance (`name`,
  `description`, subtype-specific fields like `Character.aliases`).
- **STATE** — its ordinary lifecycle (`CreativeEntityLifecycle`:
  `lifecycle`), explicitly distinct from future Canon authority.
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

| Term               | Meaning                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Creative Universe  | The top-level creative container; everything else belongs to exactly one.                             |
| Creative Work      | A specific work (novel, film, season, ...) belonging to exactly one universe.                         |
| Creative Format    | The closed set of supported work formats.                                                             |
| Creative Entity    | The foundational identity+lifecycle shape every entity subtype composes with.                         |
| Entity Kind        | The closed, discriminant tag identifying which entity subtype a value is.                             |
| Entity Scope       | Whether an entity belongs to an entire universe or one specific work within it.                       |
| Entity Ref         | A lightweight, serializable pointer to an entity (universe + entity id + kind), not an embedded copy. |
| Lifecycle          | An entity's ordinary draft/active/archived state — never Canon authority.                             |
| Temporal Reference | When an event occurs in-universe: exact/textual/relative/unknown.                                     |
| Narrative Position | (Deferred — see below.) When the audience encounters something, as opposed to when it occurs.         |

## Creative Universe

`packages/domain/src/universe/creative-universe.ts`

```
CreativeUniverse { id: UniverseId; name: string; description?: string; createdAt: UtcTimestamp }
```

Invariants: `name` must be non-empty after trimming; `id` is generated if
omitted, otherwise validated; `createdAt` is generated (`nowAsUtcTimestamp()`)
if omitted, otherwise validated (a pre-branded `UtcTimestamp` is accepted
without re-validation; a plain string is parsed and validated).

## Creative Work

`packages/domain/src/work/creative-work.ts`

```
CreativeWork { id: WorkId; universeId: UniverseId; title: string; format: CreativeFormat; description?: string; createdAt: UtcTimestamp }
```

`universeId` is a required field (compile-time enforced; also validated
at runtime). `title` must be non-empty after trimming. `format` must be a
supported `CreativeFormat`.

## Creative Format

`packages/domain/src/format/creative-format.ts`

A closed union: `'novel' | 'feature-film' | 'television' | 'sitcom' |
'animation' | 'narrative-game' | 'rpg' | 'graphic-narrative'`.

**Extension strategy**: adding a new format is a deliberate, reviewed
change to this literal union (and `isCreativeFormat`/
`assertCreativeFormat`) in a future directive — it is not
data-driven/open-ended, so every consumer that switches on `CreativeFormat`
is forced by `tsc` to handle new formats explicitly.

## Creative Entity Foundation

`packages/domain/src/entity/{entity-kind,entity-scope,entity-ref,entity-identity}.ts`

- `EntityKind`: closed union of the 8 implemented kinds (see below).
- `CreativeEntityIdentity<TKind extends EntityKind>`: `{ id: EntityId; kind: TKind; scope: EntityScope }`.
- `CreativeEntityLifecycle`: `{ lifecycle: LifecycleState }`.

Each concrete entity subtype (`Character`, `Location`, ...) is declared as
`interface X extends CreativeEntityIdentity<'x'>, CreativeEntityLifecycle { ...content }`.
Every subtype's `createX` function hardcodes its own kind literal
internally (via the shared, module-internal `resolveEntityIdentity`
helper) and does not accept a caller-supplied `kind` — an entity can
never misidentify its own subtype, at compile time (no `kind` field to
override) or at runtime (nothing reads a caller-supplied kind).

## Entity Kind Decisions

**Included** (foundational, directive-required): `character`, `location`,
`creative-object`, `faction`, `event`, `concept`, `theme`, `rule`.

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

Aliases: each is trimmed; an empty-after-trim alias is rejected (fails
closed rather than silently dropping); exact-duplicate aliases are
removed, preserving first-occurrence order; case is **never folded**
(aliases are case-sensitive proper nouns — e.g. "Doc" and "DOC" may be
meaningfully different in-universe).

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

A location is valid with no parent. Only the local invariant "a Location
may not directly parent itself" is enforced (`parentLocationId === id`);
full hierarchy-cycle detection requires graph/repository context beyond
a single value and is out of scope for this directive.

## Creative Object

`packages/domain/src/creative-object/creative-object.ts`

```
CreativeObject extends CreativeEntityIdentity<'creative-object'>, CreativeEntityLifecycle {
  name: string; description?: string;
}
```

Named `CreativeObject`, not `Object`, to avoid colliding with
JavaScript's built-in `Object`. Deliberately not implemented: ownership
history, inventory, physical simulation, artifact provenance.

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

## Creative Event

`packages/domain/src/event/creative-event.ts`

```
CreativeEvent extends CreativeEntityIdentity<'event'>, CreativeEntityLifecycle {
  title: string; description?: string; temporalReference?: TemporalReference;
}
```

An event is valid with no temporal information at all (`temporalReference`
is optional), and separately may hold the `unknown` variant of
`TemporalReference` when timing is deliberately marked unresolved.
Deliberately not implemented: chronology engine, causal/event-dependency
graph, Mystery Ledger truth, character/audience knowledge of the event.

## Concept

`packages/domain/src/concept/concept.ts`

```
Concept extends CreativeEntityIdentity<'concept'>, CreativeEntityLifecycle {
  name: string; description?: string;
}
```

For abstract creative ideas that are not themes, rules, objects, or any
other more specific kind. Deliberately kept minimal so it is not misused
as a catch-all for concepts that should instead get their own kind in a
future directive.

## Theme

`packages/domain/src/theme/theme.ts`

```
Theme extends CreativeEntityIdentity<'theme'>, CreativeEntityLifecycle {
  name: string; description?: string;
}
```

## Rule

`packages/domain/src/rule/rule.ts`

```
Rule extends CreativeEntityIdentity<'rule'>, CreativeEntityLifecycle {
  name: string; description?: string;
}
```

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

This is an entity's **ordinary** working state — not Canon. No lifecycle
value in this closed union is, or resembles, a Canon-authority state
(e.g. there is no `'locked_canon'`, `'canon'`, `'candidate'`, or similar
value). `resolveLifecycleState(undefined)` defaults to `'draft'`;
resolving any other string throws `DomainValidationError`. The future
Canon Ledger (ADR 0007) will define its own, entirely separate versioned/
provenance-tracked state machine — it is not layered on top of, or
derived from, `LifecycleState`.

## Identifier Strategy

`packages/domain/src/ids/{universe-id,work-id,entity-id,id-format}.ts`

Each of `UniverseId`, `WorkId`, `EntityId` is a **branded (nominal)**
string type: `string & { readonly [brand]: true }` with a distinct,
unexported `unique symbol` brand per type, so structurally identical
branded types are not mutually assignable — a `WorkId` cannot be passed
where a `UniverseId` is required without an explicit, intentional cast.
See ADR 0013 for the full rationale.

- **Runtime format**: UUID v4 (validated via a shared internal regex).
- **Generation**: `generateXId()` uses Node's built-in `node:crypto`
  `randomUUID()` — no new dependency.
- **Serialization**: a branded ID is a plain string at runtime, so
  `JSON.stringify`/`JSON.parse` round-trips it exactly as a string (the
  brand exists only in the type system and disappears after
  deserialization — a consumer must re-validate with `isXId`/`createXId`
  after crossing a real wire boundary, which this directive does not
  implement).

## Entity Reference Strategy

`packages/domain/src/entity/entity-ref.ts`

```
EntityRef { universeId: UniverseId; entityId: EntityId; kind: EntityKind }
```

`universeId` is included alongside `entityId` — not merely `entityId`
alone — for the same isolation reasoning as `WorkEntityScope` (see
below): a reference's universe is always known without a lookup/join,
and a reference can never accidentally resolve into the wrong universe's
entity if two universes ever reuse comparable identifiers in some future
storage layer. `EntityRef` is a lightweight pointer only — it never
embeds the referenced entity's content.

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
as `EntityRef` above.

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
temporal knowledge.

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

## Immutability / Serialization

Every domain type is declared with `readonly` fields (and `readonly
string[]` for array fields, e.g. `Character.aliases`) — domain values are
not mutated in place; a new value must be constructed to represent a
change. Every domain type is plain, JSON-safe data (no class instances,
no functions, no `Map`/`Set`, no circular references) — `JSON.stringify`
followed by `JSON.parse` always recovers an equivalent plain object (see
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
`resolveEntityIdentity`, `ids/id-format.ts`'s UUID validator) are
deliberately not re-exported, so consumers depend on stable, deliberate
surface area rather than deep imports into implementation modules.
