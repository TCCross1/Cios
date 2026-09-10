/**
 * @cios/provenance
 *
 * The foundational CIOS provenance/lineage model (Directive 004):
 * immutable records of WHERE creative material came from and HOW it was
 * derived. This package intentionally never encodes whether something is
 * true, good, Canon, approved, or trustworthy — see
 * `docs/architecture/provenance-foundation.md` for the full model and
 * `docs/architecture/adr/0014-*.md` for the governing decisions.
 *
 * This is the package's curated public API — internal module-local
 * helpers (e.g. `contributors/provenance-contributor.ts`'s
 * `normalizeContributorRef`, `references/external-source-ref.ts`'s
 * `normalizeSourceLocator`) are intentionally not re-exported here, so
 * consumers depend on stable, deliberate surface area rather than deep
 * imports into implementation modules.
 *
 * Directive 004 intentionally does NOT implement: the Spark Engine, the
 * Interpretation Engine, the Canon Ledger, the Creation Graph engine,
 * Story Genome, Creator Intent, Muse, Creative Chief, AI invocation/
 * providers, persistence/repositories/database, product API/UI,
 * authentication, billing, Production Studios, or the Adaptation Engine.
 */

// Identifiers
export {
  type ProvenanceId,
  createProvenanceId,
  generateProvenanceId,
  isProvenanceId,
} from './ids/index.js';

// Provenance type classification
export { type ProvenanceType, isProvenanceType, createProvenanceType } from './types/index.js';

// Contributors
export {
  type ContributorKind,
  isContributorKind,
  type ProvenanceContributorRef,
  createProvenanceContributorRef,
} from './contributors/index.js';

// References
export {
  type ProvenanceRef,
  createProvenanceRef,
  isProvenanceRef,
  type ExternalSourceKind,
  isExternalSourceKind,
  type ExternalSourceRef,
  createExternalSourceRef,
} from './references/index.js';

// Provenance record
export {
  type ProvenanceRecord,
  type CreateProvenanceRecordInput,
  createProvenanceRecord,
} from './record/index.js';
