import { DomainValidationError } from '../errors/domain-validation-error.js';
import { generateUniverseId, isUniverseId, type UniverseId } from '../ids/universe-id.js';
import {
  createUtcTimestamp,
  isUtcTimestamp,
  nowAsUtcTimestamp,
  type UtcTimestamp,
} from '../temporal/utc-timestamp.js';

/**
 * The top-level creative container CIOS organizes everything else
 * underneath: works, entities, and (in later directives) Sparks, Canon,
 * and the Creation Graph all belong to exactly one `CreativeUniverse`.
 * This directive models only the foundational identity/content/state a
 * universe needs to exist as an addressable concept — not any of those
 * later systems.
 */
export interface CreativeUniverse {
  readonly id: UniverseId;
  readonly name: string;
  readonly description?: string;
  readonly createdAt: UtcTimestamp;
}

export interface CreateCreativeUniverseInput {
  readonly id?: UniverseId;
  readonly name: string;
  readonly description?: string;
  readonly createdAt?: UtcTimestamp | string;
}

function resolveName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new DomainValidationError(
      'creative_universe.name_empty',
      'CreativeUniverse.name must not be empty or whitespace-only.',
      'name',
    );
  }
  return trimmed;
}

function resolveId(id: UniverseId | undefined): UniverseId {
  if (id === undefined) {
    return generateUniverseId();
  }
  if (!isUniverseId(id)) {
    throw new DomainValidationError(
      'creative_universe.id_malformed',
      `CreativeUniverse.id must be a valid UniverseId, received: ${JSON.stringify(id)}.`,
      'id',
    );
  }
  return id;
}

function resolveCreatedAt(createdAt: UtcTimestamp | string | undefined): UtcTimestamp {
  if (createdAt === undefined) {
    return nowAsUtcTimestamp();
  }
  return isUtcTimestamp(createdAt) ? createdAt : createUtcTimestamp(createdAt);
}

/**
 * Validates and constructs a well-formed {@link CreativeUniverse}. Throws
 * {@link DomainValidationError} for an empty/whitespace-only name, a
 * malformed `id`, or a malformed `createdAt`.
 */
export function createCreativeUniverse(input: CreateCreativeUniverseInput): CreativeUniverse {
  const universe: CreativeUniverse = {
    id: resolveId(input.id),
    name: resolveName(input.name),
    createdAt: resolveCreatedAt(input.createdAt),
    ...(input.description !== undefined ? { description: input.description } : {}),
  };
  return universe;
}
