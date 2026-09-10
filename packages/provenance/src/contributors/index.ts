/**
 * @cios/provenance contributors
 *
 * `ProvenanceContributorRef` — who materially contributed to a lineage
 * node (a "creator" or an "ai"), never how good or authoritative that
 * contribution is. `normalizeContributorRef` (duplicate-detection
 * comparison) is intentionally not re-exported — internal to this module
 * and `record/provenance-record.ts`.
 */
export {
  type ProvenanceContributorKind,
  isProvenanceContributorKind,
  type ProvenanceContributorRef,
  createProvenanceContributorRef,
} from './provenance-contributor.js';
