/**
 * @cios/domain
 *
 * Pure domain rules for CIOS. Expresses core domain concepts and
 * invariants with no outward CIOS architectural dependencies: no web
 * frameworks, no database drivers, no provider SDKs, no other CIOS
 * packages. This is the innermost layer of the dependency direction
 * defined in `docs/architecture/CONSTITUTION.md` (section U).
 *
 * Directive 003 implements the Creative Domain Kernel: the foundational,
 * deterministic vocabulary (`CreativeUniverse`, `CreativeWork`,
 * `CreativeFormat`, the `CreativeEntity` foundation, and its foundational
 * subtypes `Character`/`Location`/`CreativeObject`/`Faction`/
 * `CreativeEvent`/`Concept`/`Theme`/`Rule`, plus `TemporalReference`)
 * later CIOS systems will depend on. See
 * `docs/architecture/creative-domain-model.md` for the full model and
 * `docs/architecture/adr/` for consequential decisions (branded
 * identifier strategy, entity subtype strategy).
 *
 * This is the package's curated public API — internal module-local
 * helpers (e.g. `entity/entity-identity.ts`'s `resolveEntityIdentity`,
 * `ids/id-format.ts`'s UUID-v4 validator) are intentionally not
 * re-exported here, so consumers depend on stable, deliberate surface
 * area rather than deep imports into implementation modules.
 *
 * Directive 003 intentionally does NOT implement: Canon/Locked Canon/
 * Canon Ledger, the Spark Engine, the Creation Graph engine, provenance
 * schema/storage, persistence, AI/agents, authentication, or any product
 * API/UI. See `docs/architecture/creative-domain-model.md`, "Intentionally
 * Deferred Systems".
 */

// Errors
export { DomainValidationError } from './errors/index.js';

// Identifiers
export {
  type UniverseId,
  createUniverseId,
  generateUniverseId,
  isUniverseId,
  type WorkId,
  createWorkId,
  generateWorkId,
  isWorkId,
  type EntityId,
  createEntityId,
  generateEntityId,
  isEntityId,
} from './ids/index.js';

// Lifecycle
export { type LifecycleState, isLifecycleState, resolveLifecycleState } from './lifecycle/index.js';

// Creative format
export { type CreativeFormat, isCreativeFormat, assertCreativeFormat } from './format/index.js';

// Temporal
export {
  type UtcTimestamp,
  isUtcTimestamp,
  createUtcTimestamp,
  nowAsUtcTimestamp,
  type TemporalReference,
  type ExactTemporalReference,
  type TextualTemporalReference,
  type RelativeTemporalReference,
  type UnknownTemporalReference,
  createTemporalReference,
} from './temporal/index.js';

// Creative entity foundation
export {
  type EntityKind,
  isEntityKind,
  type EntityScope,
  type UniverseEntityScope,
  type WorkEntityScope,
  createEntityScope,
  type EntityRef,
  createEntityRef,
  type CreativeEntityIdentity,
  type CreativeEntityLifecycle,
} from './entity/index.js';

// Creative universe and work
export {
  type CreativeUniverse,
  type CreateCreativeUniverseInput,
  createCreativeUniverse,
} from './universe/index.js';
export {
  type CreativeWork,
  type CreateCreativeWorkInput,
  createCreativeWork,
} from './work/index.js';

// Foundational entity subtypes
export { type Character, type CreateCharacterInput, createCharacter } from './character/index.js';
export { type Location, type CreateLocationInput, createLocation } from './location/index.js';
export {
  type CreativeObject,
  type CreateCreativeObjectInput,
  createCreativeObject,
} from './creative-object/index.js';
export { type Faction, type CreateFactionInput, createFaction } from './faction/index.js';
export {
  type CreativeEvent,
  type CreateCreativeEventInput,
  createCreativeEvent,
} from './event/index.js';
export { type Concept, type CreateConceptInput, createConcept } from './concept/index.js';
export { type Theme, type CreateThemeInput, createTheme } from './theme/index.js';
export { type Rule, type CreateRuleInput, createRule } from './rule/index.js';
