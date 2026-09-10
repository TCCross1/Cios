/**
 * @cios/provenance references
 *
 * `ProvenanceRef` — a lightweight pointer to a `ProvenanceRecord`, usable
 * by future creative artifacts without embedding the record.
 * `ExternalSourceRef` — a reference to material imported from outside
 * CIOS, used only by `imported-reference` records. `normalizeSourceLocator`
 * is intentionally not re-exported — internal to this module and
 * `record/provenance-record.ts`.
 */
export { type ProvenanceRef, createProvenanceRef, isProvenanceRef } from './provenance-ref.js';
export {
  type ExternalSourceKind,
  isExternalSourceKind,
  type ExternalSourceRef,
  createExternalSourceRef,
} from './external-source-ref.js';
