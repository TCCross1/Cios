import {
  DomainValidationError,
  createEntityScope,
  createUtcTimestamp,
  isUniverseId,
  isUtcTimestamp,
  nowAsUtcTimestamp,
  type EntityScope,
  type UniverseId,
  type UtcTimestamp,
} from '@cios/domain';
import {
  createProvenanceRef,
  isProvenanceType,
  type ProvenanceRecord,
  type ProvenanceRef,
} from '@cios/provenance';
import { createSparkId, generateSparkId, isSparkId, type SparkId } from '../ids/spark-id.js';
import {
  createSparkSource,
  type SparkSource,
  type SparkSourceInput,
} from '../source/spark-source.js';
import type { Spark } from './spark.js';

const ERROR_SCOPE = 'spark_capture';

/**
 * A raw Spark may only be acquired from `creator-original` or
 * `imported-reference` provenance. AI-generated or human/AI co-produced
 * material (`ai-interpretation`, `ai-suggestion`, `ai-expansion`,
 * `ai-revision`, `hybrid`) must enter a later Interpretation/Proposal
 * workflow rather than masquerade as raw creator inspiration (Directive
 * 005, section 21).
 */
const ALLOWED_RAW_SPARK_PROVENANCE_TYPES: ReadonlySet<string> = new Set([
  'creator-original',
  'imported-reference',
]);

/** Public input accepted by {@link captureSpark}. */
export interface CaptureSparkInput {
  readonly sparkId?: SparkId | string;
  readonly scope: EntityScope;
  readonly provenanceRecord: ProvenanceRecord;
  readonly capturedAt?: UtcTimestamp | string;
  readonly source: SparkSourceInput;
}

function resolveSparkId(raw: SparkId | string | undefined): SparkId {
  if (raw === undefined) {
    return generateSparkId();
  }
  return isSparkId(raw) ? raw : createSparkId(raw);
}

function resolveCapturedAt(raw: UtcTimestamp | string | undefined): UtcTimestamp {
  if (raw === undefined) {
    return nowAsUtcTimestamp();
  }
  return isUtcTimestamp(raw) ? raw : createUtcTimestamp(raw);
}

/**
 * Revalidates `input` as a well-formed {@link EntityScope} through
 * `@cios/domain`'s certified public API, rather than trusting a caller's
 * TypeScript type assertion at runtime (Directive 005, section 25). A
 * fresh, frozen scope object is always returned — the caller's own scope
 * object (if malformed or later mutated) can never affect the resulting
 * `Spark` (Directive 005, section 31).
 */
function resolveScope(input: unknown): EntityScope {
  if (typeof input !== 'object' || input === null) {
    throw new DomainValidationError(
      `${ERROR_SCOPE}.scope_malformed`,
      `CaptureSparkInput.scope must be a valid EntityScope, received: ${JSON.stringify(input)}.`,
      'scope',
    );
  }
  const candidate = input as {
    readonly kind?: unknown;
    readonly universeId?: unknown;
    readonly workId?: unknown;
  };

  if (candidate.kind === 'universe') {
    return createEntityScope({
      kind: 'universe',
      universeId: candidate.universeId as UniverseId,
    });
  }
  if (candidate.kind === 'work') {
    return createEntityScope({
      kind: 'work',
      universeId: candidate.universeId as UniverseId,
      workId: candidate.workId as never,
    });
  }
  throw new DomainValidationError(
    `${ERROR_SCOPE}.scope_malformed`,
    `CaptureSparkInput.scope.kind must be "universe" or "work", received: ${JSON.stringify(candidate.kind)}.`,
    'scope',
  );
}

/**
 * Revalidates the subset of `provenanceRecord` a Spark needs — record
 * identity/reference formability, universe consistency, and permitted
 * provenance type — through `@cios/provenance`'s certified public API,
 * without duplicating the full `ProvenanceRecord` validator inside
 * `@cios/application` (Directive 005, section 25). Never trusts a
 * caller's TypeScript type assertion: a runtime-malformed
 * `provenanceRecord` (even one that bypasses TypeScript) fails here.
 */
function resolveProvenanceRef(
  provenanceRecord: unknown,
  scopeUniverseId: UniverseId,
): ProvenanceRef {
  if (typeof provenanceRecord !== 'object' || provenanceRecord === null) {
    throw new DomainValidationError(
      `${ERROR_SCOPE}.provenance_record_malformed`,
      `CaptureSparkInput.provenanceRecord must be a valid ProvenanceRecord, received: ${JSON.stringify(provenanceRecord)}.`,
      'provenanceRecord',
    );
  }
  const candidate = provenanceRecord as {
    readonly provenanceId?: unknown;
    readonly universeId?: unknown;
    readonly provenanceType?: unknown;
  };

  if (!isProvenanceType(candidate.provenanceType)) {
    throw new DomainValidationError(
      `${ERROR_SCOPE}.provenance_type_invalid`,
      `CaptureSparkInput.provenanceRecord.provenanceType must be a valid ProvenanceType, received: ${JSON.stringify(candidate.provenanceType)}.`,
      'provenanceRecord',
    );
  }

  if (!ALLOWED_RAW_SPARK_PROVENANCE_TYPES.has(candidate.provenanceType)) {
    throw new DomainValidationError(
      `${ERROR_SCOPE}.provenance_type_not_permitted`,
      `A raw Spark may only be captured from a "creator-original" or "imported-reference" ProvenanceRecord; received: ${JSON.stringify(candidate.provenanceType)}.`,
      'provenanceRecord',
    );
  }

  if (!isUniverseId(candidate.universeId)) {
    throw new DomainValidationError(
      `${ERROR_SCOPE}.provenance_universe_id_malformed`,
      `CaptureSparkInput.provenanceRecord.universeId must be a valid UniverseId, received: ${JSON.stringify(candidate.universeId)}.`,
      'provenanceRecord',
    );
  }

  if (candidate.universeId !== scopeUniverseId) {
    throw new DomainValidationError(
      `${ERROR_SCOPE}.cross_universe_provenance`,
      `Spark capture requires provenanceRecord.universeId (${JSON.stringify(candidate.universeId)}) to match scope.universeId (${JSON.stringify(scopeUniverseId)}).`,
      'provenanceRecord',
    );
  }

  // createProvenanceRef independently revalidates provenanceId/universeId
  // through @cios/provenance's certified public API — this is the only
  // piece of the full ProvenanceRecord shape Spark actually needs to
  // retain, and it is never trusted merely because it type-checked at
  // compile time.
  return createProvenanceRef({
    universeId: candidate.universeId,
    provenanceId: candidate.provenanceId as never,
  });
}

/**
 * Validates `input` and constructs a well-formed, runtime-frozen {@link
 * Spark}. Throws {@link DomainValidationError} for any malformed
 * component, a disallowed provenance type, or a cross-universe
 * provenance/scope mismatch. Never persists the result and never returns
 * a repository-assigned identifier — Directive 005 is an in-memory,
 * deterministic application/domain workflow only.
 */
export function captureSpark(input: CaptureSparkInput): Spark {
  const scope = resolveScope(input.scope);
  const provenanceRef = resolveProvenanceRef(input.provenanceRecord, scope.universeId);
  const sparkId = resolveSparkId(input.sparkId);
  const capturedAt = resolveCapturedAt(input.capturedAt);
  const source: SparkSource = createSparkSource(input.source);

  return Object.freeze({
    sparkId,
    universeId: scope.universeId,
    scope,
    provenanceRef,
    capturedAt,
    source,
  });
}
