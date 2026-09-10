import { DomainValidationError } from '@cios/domain';

/**
 * The exact, closed vocabulary describing WHERE a piece of creative
 * material came from and HOW it was derived — never whether it is true,
 * good, Canon, approved, or trustworthy (Directive 004, section 1).
 * `ProvenanceType` is a lineage classification, not a quality, trust, or
 * authority signal.
 *
 * - `creator-original`: creator-authored material whose direct creative
 *   authorship is human/creator, not AI.
 * - `ai-interpretation`: AI-generated interpretation of existing
 *   material.
 * - `ai-suggestion`: AI-generated creative proposal or possibility.
 * - `ai-expansion`: AI-generated elaboration/additional detail derived
 *   from existing material.
 * - `ai-revision`: AI-generated alteration/reworking of existing
 *   material.
 * - `hybrid`: material materially co-produced through both creator and
 *   AI authorship.
 * - `imported-reference`: external material imported into CIOS for
 *   reference/context rather than authored by CIOS or treated as
 *   creator-original material.
 *
 * No aliases, abbreviations, or additional values are permitted in
 * Directive 004 — see `record/provenance-record.ts` for the per-type
 * structural invariants this vocabulary drives.
 */
export type ProvenanceType =
  | 'creator-original'
  | 'ai-interpretation'
  | 'ai-suggestion'
  | 'ai-expansion'
  | 'ai-revision'
  | 'hybrid'
  | 'imported-reference';

const PROVENANCE_TYPES: readonly ProvenanceType[] = [
  'creator-original',
  'ai-interpretation',
  'ai-suggestion',
  'ai-expansion',
  'ai-revision',
  'hybrid',
  'imported-reference',
];

/** Runtime type guard for `ProvenanceType`. */
export function isProvenanceType(value: unknown): value is ProvenanceType {
  return typeof value === 'string' && (PROVENANCE_TYPES as readonly string[]).includes(value);
}

/**
 * Validates `raw` as a `ProvenanceType`. Throws {@link
 * DomainValidationError} when `raw` is not one of the exact canonical
 * literals (no synonym, abbreviation, or case variation is accepted).
 */
export function createProvenanceType(raw: string): ProvenanceType {
  if (!isProvenanceType(raw)) {
    throw new DomainValidationError(
      'provenance_type.invalid',
      `ProvenanceType must be one of ${PROVENANCE_TYPES.map((type) => `"${type}"`).join(', ')}, received: ${JSON.stringify(raw)}.`,
      'provenanceType',
    );
  }
  return raw;
}
