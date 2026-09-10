import { DomainValidationError, isUniverseId, type UniverseId } from '@cios/domain';
import { isSparkId, type SparkId } from '../ids/spark-id.js';

/**
 * A lightweight, serializable pointer to a {@link Spark}, usable by
 * future systems (Interpretation/Proposal workflows, the Creation Graph,
 * ...) without embedding or copying the Spark's raw source content.
 * Deliberately minimal: it identifies *which* Spark is being referenced
 * and *which universe* it belongs to — nothing about the raw source
 * itself (Directive 005, section 6).
 *
 * `universeId` is included alongside `sparkId` for the same
 * defense-in-depth isolation reasoning as `@cios/domain`'s `EntityRef`
 * and `@cios/provenance`'s `ProvenanceRef`: a consumer can reject a
 * reference whose `universeId` does not match the universe it is
 * currently operating in without needing to resolve `sparkId` first.
 */
export interface SparkRef {
  readonly universeId: UniverseId;
  readonly sparkId: SparkId;
}

/**
 * Validates and constructs a well-formed, runtime-frozen {@link
 * SparkRef}. Throws {@link DomainValidationError} for any malformed or
 * missing component (never silently drops one).
 */
export function createSparkRef(input: {
  readonly universeId: UniverseId;
  readonly sparkId: SparkId;
}): SparkRef {
  if (!isUniverseId(input.universeId)) {
    throw new DomainValidationError(
      'spark_ref.universe_id_malformed',
      `SparkRef.universeId must be a valid UniverseId, received: ${JSON.stringify(input.universeId)}.`,
      'universeId',
    );
  }
  if (!isSparkId(input.sparkId)) {
    throw new DomainValidationError(
      'spark_ref.spark_id_malformed',
      `SparkRef.sparkId must be a valid SparkId, received: ${JSON.stringify(input.sparkId)}.`,
      'sparkId',
    );
  }

  return Object.freeze({
    universeId: input.universeId,
    sparkId: input.sparkId,
  });
}

/** Runtime type guard for `SparkRef`. */
export function isSparkRef(value: unknown): value is SparkRef {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as { readonly universeId?: unknown; readonly sparkId?: unknown };
  return (
    typeof candidate.universeId === 'string' &&
    isUniverseId(candidate.universeId) &&
    typeof candidate.sparkId === 'string' &&
    isSparkId(candidate.sparkId)
  );
}
