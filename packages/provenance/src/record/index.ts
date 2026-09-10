/**
 * @cios/provenance record
 *
 * `ProvenanceRecord` — the immutable lineage node itself, composing
 * `ProvenanceId`/`UniverseId` identity, `ProvenanceType` classification,
 * `ProvenanceContributorRef[]`, `ProvenanceRef[]` parent lineage,
 * `ExternalSourceRef[]` external sources, and a single `createdAt`
 * timestamp (deliberately no `updatedAt` — see `provenance-record.ts`).
 */
export {
  type ProvenanceRecord,
  type CreateProvenanceRecordInput,
  createProvenanceRecord,
} from './provenance-record.js';
