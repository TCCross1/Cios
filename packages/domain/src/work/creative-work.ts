import { DomainValidationError } from '../errors/domain-validation-error.js';
import { generateWorkId, isWorkId, type WorkId } from '../ids/work-id.js';
import { isUniverseId, type UniverseId } from '../ids/universe-id.js';
import { assertCreativeFormat, type CreativeFormat } from '../format/creative-format.js';
import {
  createUtcTimestamp,
  isUtcTimestamp,
  nowAsUtcTimestamp,
  type UtcTimestamp,
} from '../temporal/utc-timestamp.js';

/**
 * A specific creative work (a novel, a film, a season of television, ...)
 * belonging to exactly one {@link CreativeUniverse}. Foundational
 * identity/content/state only — adaptation, production, and Story Genome
 * concerns are later systems.
 */
export interface CreativeWork {
  readonly id: WorkId;
  readonly universeId: UniverseId;
  readonly title: string;
  readonly format: CreativeFormat;
  readonly description?: string;
  readonly createdAt: UtcTimestamp;
}

export interface CreateCreativeWorkInput {
  readonly id?: WorkId;
  readonly universeId: UniverseId;
  readonly title: string;
  readonly format: CreativeFormat;
  readonly description?: string;
  readonly createdAt?: UtcTimestamp | string;
}

function resolveTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new DomainValidationError(
      'creative_work.title_empty',
      'CreativeWork.title must not be empty or whitespace-only.',
      'title',
    );
  }
  return trimmed;
}

function resolveId(id: WorkId | undefined): WorkId {
  if (id === undefined) {
    return generateWorkId();
  }
  if (!isWorkId(id)) {
    throw new DomainValidationError(
      'creative_work.id_malformed',
      `CreativeWork.id must be a valid WorkId, received: ${JSON.stringify(id)}.`,
      'id',
    );
  }
  return id;
}

function resolveUniverseId(universeId: UniverseId): UniverseId {
  if (!isUniverseId(universeId)) {
    throw new DomainValidationError(
      'creative_work.universe_id_malformed',
      `CreativeWork.universeId must be a valid UniverseId, received: ${JSON.stringify(universeId)}.`,
      'universeId',
    );
  }
  return universeId;
}

function resolveCreatedAt(createdAt: UtcTimestamp | string | undefined): UtcTimestamp {
  if (createdAt === undefined) {
    return nowAsUtcTimestamp();
  }
  return isUtcTimestamp(createdAt) ? createdAt : createUtcTimestamp(createdAt);
}

/**
 * Validates and constructs a well-formed {@link CreativeWork}. Throws
 * {@link DomainValidationError} for a missing/malformed `universeId`, an
 * empty/whitespace-only `title`, an unsupported `format`, or a malformed
 * `id`/`createdAt`.
 */
export function createCreativeWork(input: CreateCreativeWorkInput): CreativeWork {
  const work: CreativeWork = {
    id: resolveId(input.id),
    universeId: resolveUniverseId(input.universeId),
    title: resolveTitle(input.title),
    format: assertCreativeFormat(input.format),
    createdAt: resolveCreatedAt(input.createdAt),
    ...(input.description !== undefined ? { description: input.description } : {}),
  };
  return work;
}
