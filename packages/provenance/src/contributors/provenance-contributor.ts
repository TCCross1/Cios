import { DomainValidationError } from '@cios/domain';

/**
 * Who materially contributed to a piece of lineage — never *how good*,
 * *approved*, or *authoritative* that contribution is. `ProvenanceContributorKind`
 * distinguishes a human creator's authorship from an AI system's
 * authorship; it does not identify a specific person or model.
 */
export type ProvenanceContributorKind = 'creator' | 'ai';

const PROVENANCE_CONTRIBUTOR_KINDS: readonly ProvenanceContributorKind[] = ['creator', 'ai'];

/** Runtime type guard for `ProvenanceContributorKind`. */
export function isProvenanceContributorKind(value: unknown): value is ProvenanceContributorKind {
  return (
    typeof value === 'string' && (PROVENANCE_CONTRIBUTOR_KINDS as readonly string[]).includes(value)
  );
}

/**
 * A single contributor attached to a {@link ProvenanceRecord}.
 * `contributorRef` is an opaque, caller-supplied identifier for the
 * contributor (e.g. a creator account identifier or an AI
 * model/provider identifier) — this package does not validate its
 * format beyond requiring non-empty, non-whitespace-only text, since
 * contributor identity resolution is out of scope for the provenance
 * foundation.
 */
export interface ProvenanceContributorRef {
  readonly contributorKind: ProvenanceContributorKind;
  readonly contributorRef: string;
}

/**
 * Validates and constructs a well-formed, runtime-frozen {@link
 * ProvenanceContributorRef}. Throws {@link DomainValidationError} for any
 * malformed or missing component. `contributorRef` is trimmed before
 * being stored.
 */
export function createProvenanceContributorRef(input: {
  readonly contributorKind: ProvenanceContributorKind;
  readonly contributorRef: string;
}): ProvenanceContributorRef {
  if (!isProvenanceContributorKind(input.contributorKind)) {
    throw new DomainValidationError(
      'provenance_contributor.contributor_kind_invalid',
      `ProvenanceContributorRef.contributorKind must be "creator" or "ai", received: ${JSON.stringify(input.contributorKind)}.`,
      'contributorKind',
    );
  }
  if (typeof input.contributorRef !== 'string' || input.contributorRef.trim().length === 0) {
    throw new DomainValidationError(
      'provenance_contributor.contributor_ref_empty',
      `ProvenanceContributorRef.contributorRef must be a non-empty, non-whitespace-only string, received: ${JSON.stringify(input.contributorRef)}.`,
      'contributorRef',
    );
  }

  return Object.freeze({
    contributorKind: input.contributorKind,
    contributorRef: input.contributorRef.trim(),
  });
}

/**
 * Normalizes a `contributorRef` for duplicate-detection comparison
 * (trimmed, exact case). Internal to the `contributors`/`record` modules
 * — not part of the package's public API.
 */
export function normalizeContributorRef(contributorRef: string): string {
  return contributorRef.trim();
}
