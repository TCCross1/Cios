import { DomainValidationError } from '../errors/domain-validation-error.js';
import { isEntityId, type EntityId } from '../ids/entity-id.js';
import type { EntityScope } from '../entity/entity-scope.js';
import {
  resolveEntityIdentity,
  type CreativeEntityIdentity,
  type CreativeEntityLifecycle,
} from '../entity/entity-identity.js';
import type { LifecycleState } from '../lifecycle/lifecycle-state.js';
import type { UtcTimestamp } from '../temporal/utc-timestamp.js';
import { resolveDisplayText } from '../entity/internal/display-text.js';

/**
 * Foundational Location. CIOS must eventually support hierarchical places
 * (Country → City → Building → Floor → Room) via `parentLocationId`, but
 * this directive does not implement GIS or full hierarchy-cycle
 * detection (which requires graph/repository context beyond a single
 * `Location` value). Only the local invariant "a Location may not
 * directly parent itself" is enforced here. `name` is always identical
 * to `CreativeEntityIdentity.displayName` (Directive 003R, section 8).
 */
export interface Location extends CreativeEntityIdentity<'location'>, CreativeEntityLifecycle {
  readonly name: string;
  readonly description?: string;
  readonly parentLocationId?: EntityId;
}

export interface CreateLocationInput {
  readonly id?: EntityId;
  readonly scope: EntityScope;
  readonly lifecycleState?: LifecycleState;
  readonly createdAt?: UtcTimestamp | string;
  readonly updatedAt?: UtcTimestamp | string;
  readonly name: string;
  readonly description?: string;
  readonly parentLocationId?: EntityId;
}

function resolveName(name: string): string {
  return resolveDisplayText(name, {
    code: 'location.name_empty',
    message: 'Location.name must not be empty or whitespace-only.',
    field: 'name',
  });
}

/**
 * Validates and constructs a well-formed, runtime-frozen {@link
 * Location}. Throws {@link DomainValidationError} for an
 * empty/whitespace-only `name`, a malformed `parentLocationId`, a
 * Location directly parenting itself, or a malformed
 * `id`/`lifecycleState`/`createdAt`/`updatedAt`.
 */
export function createLocation(input: CreateLocationInput): Location {
  const name = resolveName(input.name);
  const identity = resolveEntityIdentity('location', {
    ...(input.id !== undefined ? { id: input.id } : {}),
    scope: input.scope,
    ...(input.lifecycleState !== undefined ? { lifecycleState: input.lifecycleState } : {}),
    ...(input.createdAt !== undefined ? { createdAt: input.createdAt } : {}),
    ...(input.updatedAt !== undefined ? { updatedAt: input.updatedAt } : {}),
    displayName: name,
  });

  if (input.parentLocationId !== undefined) {
    if (!isEntityId(input.parentLocationId)) {
      throw new DomainValidationError(
        'location.parent_location_id_malformed',
        `Location.parentLocationId must be a valid EntityId, received: ${JSON.stringify(input.parentLocationId)}.`,
        'parentLocationId',
      );
    }
    if (input.parentLocationId === identity.entityId) {
      throw new DomainValidationError(
        'location.self_parent',
        'A Location may not directly parent itself (parentLocationId === entityId).',
        'parentLocationId',
      );
    }
  }

  return Object.freeze({
    ...identity,
    name,
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.parentLocationId !== undefined ? { parentLocationId: input.parentLocationId } : {}),
  });
}
