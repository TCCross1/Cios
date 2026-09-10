/**
 * @cios/provenance identifiers
 *
 * `ProvenanceId` — a branded UUID-v4 identifier for exactly one
 * `ProvenanceRecord`. Not assignable to `@cios/domain`'s `UniverseId`,
 * `WorkId`, or `EntityId` at compile time.
 */
export {
  type ProvenanceId,
  createProvenanceId,
  generateProvenanceId,
  isProvenanceId,
} from './provenance-id.js';
