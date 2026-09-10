import { DomainValidationError, isUniverseId, type UniverseId } from '@cios/domain';
import { isProvenanceId, type ProvenanceId } from '../ids/provenance-id.js';

/**
 * A lightweight, serializable pointer to a {@link ProvenanceRecord},
 * usable by future creative artifacts (Sparks, interpretations,
 * proposals, graph objects, Canon decisions, ...) without embedding the
 * full lineage record. Deliberately minimal: it identifies *which*
 * lineage node is being referenced and *which universe* it belongs to —
 * nothing about the artifact doing the referencing, and nothing about
 * Canon/authority state (Directive 004, sections 4 and 7).
 *
 * `universeId` is included alongside `provenanceId` for the same
 * defense-in-depth isolation reasoning as `@cios/domain`'s `EntityRef`:
 * a consumer can reject a reference whose `universeId` does not match
 * the universe it is currently operating in without needing to resolve
 * `provenanceId` first, preventing lineage from one universe being
 * silently followed while operating inside a different one.
 */
export interface ProvenanceRef {
  readonly universeId: UniverseId;
  readonly provenanceId: ProvenanceId;
}

/**
 * Validates and constructs a well-formed, runtime-frozen {@link
 * ProvenanceRef}. Throws {@link DomainValidationError} for any malformed
 * or missing component (never silently drops one).
 */
export function createProvenanceRef(input: {
  readonly universeId: UniverseId;
  readonly provenanceId: ProvenanceId;
}): ProvenanceRef {
  if (!isUniverseId(input.universeId)) {
    throw new DomainValidationError(
      'provenance_ref.universe_id_malformed',
      `ProvenanceRef.universeId must be a valid UniverseId, received: ${JSON.stringify(input.universeId)}.`,
      'universeId',
    );
  }
  if (!isProvenanceId(input.provenanceId)) {
    throw new DomainValidationError(
      'provenance_ref.provenance_id_malformed',
      `ProvenanceRef.provenanceId must be a valid ProvenanceId, received: ${JSON.stringify(input.provenanceId)}.`,
      'provenanceId',
    );
  }

  return Object.freeze({
    universeId: input.universeId,
    provenanceId: input.provenanceId,
  });
}

/** Runtime type guard for `ProvenanceRef`. */
export function isProvenanceRef(value: unknown): value is ProvenanceRef {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as { readonly universeId?: unknown; readonly provenanceId?: unknown };
  return (
    typeof candidate.universeId === 'string' &&
    isUniverseId(candidate.universeId) &&
    typeof candidate.provenanceId === 'string' &&
    isProvenanceId(candidate.provenanceId)
  );
}
