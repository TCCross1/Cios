/**
 * @cios/domain entity
 *
 * The shared creative-entity foundation: `EntityKind` (the closed subtype
 * discriminant), `EntityScope` (universe- vs. work-level addressability),
 * `EntityRef` (a serializable pointer to an entity), and
 * `CreativeEntityIdentity`/`CreativeEntityLifecycle` (the IDENTITY and
 * STATE concerns every concrete entity subtype composes with its own
 * CONTENT). `entity-identity.ts`'s `resolveEntityIdentity` is internal —
 * used by subtype modules (`character/`, `location/`, ...), not
 * re-exported here.
 */
export { type EntityKind, isEntityKind } from './entity-kind.js';
export {
  type EntityScope,
  type UniverseEntityScope,
  type WorkEntityScope,
  createEntityScope,
} from './entity-scope.js';
export { type EntityRef, createEntityRef } from './entity-ref.js';
export { type CreativeEntityIdentity, type CreativeEntityLifecycle } from './entity-identity.js';
