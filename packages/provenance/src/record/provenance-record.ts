import {
  DomainValidationError,
  isUniverseId,
  isUtcTimestamp,
  createUtcTimestamp,
  nowAsUtcTimestamp,
  type UniverseId,
  type UtcTimestamp,
} from '@cios/domain';
import {
  createProvenanceId,
  generateProvenanceId,
  isProvenanceId,
  type ProvenanceId,
} from '../ids/provenance-id.js';
import { isProvenanceType, type ProvenanceType } from '../types/provenance-type.js';
import {
  createProvenanceContributorRef,
  normalizeContributorRef,
  type ProvenanceContributorKind,
  type ProvenanceContributorRef,
} from '../contributors/provenance-contributor.js';
import { createProvenanceRef, type ProvenanceRef } from '../references/provenance-ref.js';
import {
  createExternalSourceRef,
  normalizeSourceLocator,
  type ExternalSourceKind,
  type ExternalSourceRef,
} from '../references/external-source-ref.js';

const ERROR_SCOPE = 'provenance_record';

/**
 * An immutable lineage node: WHERE a piece of creative material came
 * from and HOW it was derived. Deliberately contains no creative content
 * payload, no Canon/authority/confidence/quality/approval state, no
 * generic `subject`/`subjectId`/`subjectType` field, and no `updatedAt`
 * — a `ProvenanceRecord` is a point-in-time fact about origin, not a
 * mutable resource with its own lifecycle (Directive 004, sections 1, 4,
 * and 8). Future artifacts (Sparks, interpretations, proposals, graph
 * objects, Canon decisions) reference a record via {@link ProvenanceRef}
 * instead of embedding it or being embedded by it.
 */
export interface ProvenanceRecord {
  readonly provenanceId: ProvenanceId;
  readonly universeId: UniverseId;
  readonly provenanceType: ProvenanceType;
  readonly contributors: readonly ProvenanceContributorRef[];
  readonly parents: readonly ProvenanceRef[];
  readonly sources: readonly ExternalSourceRef[];
  readonly createdAt: UtcTimestamp;
}

export interface CreateProvenanceRecordInput {
  readonly provenanceId?: ProvenanceId | string;
  readonly universeId: UniverseId | string;
  readonly provenanceType: ProvenanceType;
  readonly contributors?: readonly {
    readonly contributorKind: ProvenanceContributorKind;
    readonly contributorRef: string;
  }[];
  readonly parents?: readonly {
    readonly universeId: UniverseId;
    readonly provenanceId: ProvenanceId;
  }[];
  readonly sources?: readonly {
    readonly sourceKind: ExternalSourceKind;
    readonly locator: string;
    readonly label?: string;
  }[];
  readonly createdAt?: UtcTimestamp | string;
}

function resolveProvenanceId(raw: ProvenanceId | string | undefined): ProvenanceId {
  if (raw === undefined) {
    return generateProvenanceId();
  }
  return isProvenanceId(raw) ? raw : createProvenanceId(raw);
}

function resolveUniverseId(raw: UniverseId | string): UniverseId {
  if (!isUniverseId(raw)) {
    throw new DomainValidationError(
      `${ERROR_SCOPE}.universe_id_malformed`,
      `ProvenanceRecord.universeId must be a valid UniverseId, received: ${JSON.stringify(raw)}.`,
      'universeId',
    );
  }
  return raw;
}

function resolveCreatedAt(raw: UtcTimestamp | string | undefined): UtcTimestamp {
  if (raw === undefined) {
    return nowAsUtcTimestamp();
  }
  return isUtcTimestamp(raw) ? raw : createUtcTimestamp(raw);
}

function resolveContributors(
  raw: CreateProvenanceRecordInput['contributors'],
): readonly ProvenanceContributorRef[] {
  const contributors = (raw ?? []).map((entry) => createProvenanceContributorRef(entry));

  const seen = new Set<string>();
  for (const contributor of contributors) {
    const key = `${contributor.contributorKind}:${normalizeContributorRef(contributor.contributorRef)}`;
    if (seen.has(key)) {
      throw new DomainValidationError(
        `${ERROR_SCOPE}.duplicate_contributor`,
        `ProvenanceRecord.contributors contains a duplicate contributor: kind "${contributor.contributorKind}", ref ${JSON.stringify(contributor.contributorRef)}.`,
        'contributors',
      );
    }
    seen.add(key);
  }

  return Object.freeze(contributors);
}

function resolveSources(raw: CreateProvenanceRecordInput['sources']): readonly ExternalSourceRef[] {
  const sources = (raw ?? []).map((entry) => createExternalSourceRef(entry));

  const seen = new Set<string>();
  for (const source of sources) {
    const key = `${source.sourceKind}:${normalizeSourceLocator(source.locator)}`;
    if (seen.has(key)) {
      throw new DomainValidationError(
        `${ERROR_SCOPE}.duplicate_source`,
        `ProvenanceRecord.sources contains a duplicate source: kind "${source.sourceKind}", locator ${JSON.stringify(source.locator)}.`,
        'sources',
      );
    }
    seen.add(key);
  }

  return Object.freeze(sources);
}

function resolveParents(
  raw: CreateProvenanceRecordInput['parents'],
  universeId: UniverseId,
  provenanceId: ProvenanceId,
): readonly ProvenanceRef[] {
  const parents = (raw ?? []).map((entry) => createProvenanceRef(entry));

  const seen = new Set<string>();
  for (const parent of parents) {
    if (parent.universeId !== universeId) {
      throw new DomainValidationError(
        `${ERROR_SCOPE}.parent_cross_universe`,
        `ProvenanceRecord.parents must all share this record's universeId (${universeId}); received a parent from ${parent.universeId}.`,
        'parents',
      );
    }
    if (parent.provenanceId === provenanceId) {
      throw new DomainValidationError(
        `${ERROR_SCOPE}.parent_self`,
        `ProvenanceRecord.parents must not reference this record's own provenanceId (${provenanceId}).`,
        'parents',
      );
    }
    if (seen.has(parent.provenanceId)) {
      throw new DomainValidationError(
        `${ERROR_SCOPE}.parent_duplicate`,
        `ProvenanceRecord.parents contains a duplicate parent reference: ${parent.provenanceId}.`,
        'parents',
      );
    }
    seen.add(parent.provenanceId);
  }

  return Object.freeze(parents);
}

function countByKind(
  contributors: readonly ProvenanceContributorRef[],
  kind: ProvenanceContributorKind,
): number {
  return contributors.filter((contributor) => contributor.contributorKind === kind).length;
}

/**
 * Enforces the per-`ProvenanceType` structural invariants described in
 * Directive 004, sections 34-40. These are mechanical, deterministic
 * shape rules about contributors/parents/sources — never judgments about
 * truth, quality, or Canon status.
 */
function validateTypeInvariants(
  provenanceType: ProvenanceType,
  contributors: readonly ProvenanceContributorRef[],
  parents: readonly ProvenanceRef[],
  sources: readonly ExternalSourceRef[],
): void {
  const creatorCount = countByKind(contributors, 'creator');
  const aiCount = countByKind(contributors, 'ai');

  switch (provenanceType) {
    case 'creator-original': {
      if (creatorCount === 0) {
        throw new DomainValidationError(
          `${ERROR_SCOPE}.missing_creator_contributor`,
          '"creator-original" requires at least one "creator" contributor.',
          'contributors',
        );
      }
      if (aiCount > 0) {
        throw new DomainValidationError(
          `${ERROR_SCOPE}.forbidden_ai_contributor`,
          '"creator-original" must not contain any "ai" contributor.',
          'contributors',
        );
      }
      return;
    }
    case 'ai-interpretation':
    case 'ai-expansion':
    case 'ai-revision': {
      if (aiCount === 0) {
        throw new DomainValidationError(
          `${ERROR_SCOPE}.missing_ai_contributor`,
          `"${provenanceType}" requires at least one "ai" contributor.`,
          'contributors',
        );
      }
      if (creatorCount > 0) {
        throw new DomainValidationError(
          `${ERROR_SCOPE}.forbidden_creator_contributor`,
          `"${provenanceType}" must not contain any "creator" contributor.`,
          'contributors',
        );
      }
      if (parents.length === 0) {
        throw new DomainValidationError(
          `${ERROR_SCOPE}.derivation_parent_required`,
          `"${provenanceType}" requires at least one parent lineage reference.`,
          'parents',
        );
      }
      return;
    }
    case 'ai-suggestion': {
      if (aiCount === 0) {
        throw new DomainValidationError(
          `${ERROR_SCOPE}.missing_ai_contributor`,
          '"ai-suggestion" requires at least one "ai" contributor.',
          'contributors',
        );
      }
      if (creatorCount > 0) {
        throw new DomainValidationError(
          `${ERROR_SCOPE}.forbidden_creator_contributor`,
          '"ai-suggestion" must not contain any "creator" contributor.',
          'contributors',
        );
      }
      return;
    }
    case 'hybrid': {
      if (creatorCount === 0 || aiCount === 0) {
        throw new DomainValidationError(
          `${ERROR_SCOPE}.hybrid_contributor_deficiency`,
          '"hybrid" requires at least one "creator" contributor and at least one "ai" contributor.',
          'contributors',
        );
      }
      return;
    }
    case 'imported-reference': {
      if (sources.length === 0) {
        throw new DomainValidationError(
          `${ERROR_SCOPE}.imported_source_required`,
          '"imported-reference" requires at least one external source reference.',
          'sources',
        );
      }
      return;
    }
    default: {
      const unreachable: never = provenanceType;
      throw new DomainValidationError(
        `${ERROR_SCOPE}.provenance_type_unreachable`,
        `Unrecognized ProvenanceType: ${JSON.stringify(unreachable as unknown)}.`,
        'provenanceType',
      );
    }
  }
}

/**
 * Validates and constructs a well-formed, runtime-frozen {@link
 * ProvenanceRecord}. Throws {@link DomainValidationError} for any
 * malformed input or violated per-type invariant (never returns a
 * partially-valid record).
 */
export function createProvenanceRecord(input: CreateProvenanceRecordInput): ProvenanceRecord {
  if (!isProvenanceType(input.provenanceType)) {
    throw new DomainValidationError(
      `${ERROR_SCOPE}.provenance_type_invalid`,
      `ProvenanceRecord.provenanceType must be a supported ProvenanceType, received: ${JSON.stringify(input.provenanceType)}.`,
      'provenanceType',
    );
  }

  const provenanceId = resolveProvenanceId(input.provenanceId);
  const universeId = resolveUniverseId(input.universeId);
  const createdAt = resolveCreatedAt(input.createdAt);

  const contributors = resolveContributors(input.contributors);
  const sources = resolveSources(input.sources);
  const parents = resolveParents(input.parents, universeId, provenanceId);

  validateTypeInvariants(input.provenanceType, contributors, parents, sources);

  return Object.freeze({
    provenanceId,
    universeId,
    provenanceType: input.provenanceType,
    contributors,
    parents,
    sources,
    createdAt,
  });
}
