/**
 * @cios/domain identifiers
 *
 * Branded UUID-v4 identifier types for the three addressable identity
 * concerns in the domain kernel: universes, works, and entities.
 * `id-format.ts` (the shared UUID-v4 validation rule) is intentionally not
 * re-exported — it is an internal implementation detail of this module,
 * not part of the package's public API.
 */
export {
  type UniverseId,
  createUniverseId,
  generateUniverseId,
  isUniverseId,
} from './universe-id.js';
export { type WorkId, createWorkId, generateWorkId, isWorkId } from './work-id.js';
export { type EntityId, createEntityId, generateEntityId, isEntityId } from './entity-id.js';
