import { DomainValidationError } from '../errors/domain-validation-error.js';
import { generateUniverseId, isUniverseId, type UniverseId } from '../ids/universe-id.js';
import { resolveLifecycleState, type LifecycleState } from '../lifecycle/lifecycle-state.js';
import { resolveTimestampPair } from '../temporal/resolve-timestamp-pair.js';
import type { UtcTimestamp } from '../temporal/utc-timestamp.js';

/**
 * The top-level creative container CIOS organizes everything else
 * underneath: works, entities, and (in later directives) Sparks, Canon,
 * and the Creation Graph all belong to exactly one `CreativeUniverse`.
 * This directive models only the foundational identity/content/state a
 * universe needs to exist as an addressable concept — not any of those
 * later systems.
 *
 * `lifecycleState` is the same ordinary (non-Canon) lifecycle concern
 * used across the domain kernel (see `lifecycle/lifecycle-state.ts`) —
 * a universe's existence never implies Canon authority.
 */
export interface CreativeUniverse {
  readonly id: UniverseId;
  readonly name: string;
  readonly description?: string;
  readonly createdAt: UtcTimestamp;
  readonly updatedAt: UtcTimestamp;
  readonly lifecycleState: LifecycleState;
}

export interface CreateCreativeUniverseInput {
  readonly id?: UniverseId;
  readonly name: string;
  readonly description?: string;
  readonly createdAt?: UtcTimestamp | string;
  readonly updatedAt?: UtcTimestamp | string;
  readonly lifecycleState?: LifecycleState;
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

/**
 * Validates and constructs a well-formed, runtime-frozen {@link
 * CreativeUniverse}. Throws {@link DomainValidationError} for an
 * empty/whitespace-only name, a malformed `id`/`createdAt`/`updatedAt`,
 * an unsupported `lifecycleState`, or an `updatedAt` that precedes
 * `createdAt`.
 */
export function createCreativeUniverse(input: CreateCreativeUniverseInput): CreativeUniverse {
  const { createdAt, updatedAt } = resolveTimestampPair(input, 'creative_universe');
  const universe: CreativeUniverse = {
    id: resolveId(input.id),
    name: resolveName(input.name),
    createdAt,
    updatedAt,
    lifecycleState: resolveLifecycleState(input.lifecycleState),
    ...(input.description !== undefined ? { description: input.description } : {}),
  };
  return Object.freeze(universe);
}
