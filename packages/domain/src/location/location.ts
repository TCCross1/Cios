import { DomainValidationError } from '../errors/domain-validation-error.js';
import { isEntityId, type EntityId } from '../ids/entity-id.js';
import type { EntityScope } from '../entity/entity-scope.js';
import {
  resolveEntityIdentity,
  type CreativeEntityIdentity,
  type CreativeEntityLifecycle,
} from '../entity/entity-identity.js';
import type { LifecycleState } from '../lifecycle/lifecycle-state.js';

/**
 * Foundational Location. CIOS must eventually support hierarchical places
 * (Country → City → Building → Floor → Room) via `parentLocationId`, but
 * this directive does not implement GIS or full hierarchy-cycle
 * detection (which requires graph/repository context beyond a single
 * `Location` value). Only the local invariant "a Location may not
 * directly parent itself" is enforced here.
 */
export interface Location extends CreativeEntityIdentity<'location'>, CreativeEntityLifecycle {
  readonly name: string;
  readonly description?: string;
  readonly parentLocationId?: EntityId;
}

export interface CreateLocationInput {
  readonly id?: EntityId;
  readonly scope: EntityScope;
  readonly lifecycle?: LifecycleState;
  readonly name: string;
  readonly description?: string;
  readonly parentLocationId?: EntityId;
}

function resolveName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new DomainValidationError(
      'location.name_empty',
      'Location.name must not be empty or whitespace-only.',
      'name',
    );
  }
  return trimmed;
}

/**
 * Validates and constructs a well-formed {@link Location}. Throws {@link
 * DomainValidationError} for an empty/whitespace-only `name`, a malformed
 * `parentLocationId`, a Location directly parenting itself, or a
 * malformed `id`/`lifecycle`.
 */
export function createLocation(input: CreateLocationInput): Location {
  const identity = resolveEntityIdentity('location', {
    ...(input.id !== undefined ? { id: input.id } : {}),
    scope: input.scope,
    ...(input.lifecycle !== undefined ? { lifecycle: input.lifecycle } : {}),
  });

  if (input.parentLocationId !== undefined) {
    if (!isEntityId(input.parentLocationId)) {
      throw new DomainValidationError(
        'location.parent_location_id_malformed',
        `Location.parentLocationId must be a valid EntityId, received: ${JSON.stringify(input.parentLocationId)}.`,
        'parentLocationId',
      );
    }
    if (input.parentLocationId === identity.id) {
      throw new DomainValidationError(
        'location.self_parent',
        'A Location may not directly parent itself (parentLocationId === id).',
        'parentLocationId',
      );
    }
  }

  return {
    ...identity,
    name: resolveName(input.name),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.parentLocationId !== undefined ? { parentLocationId: input.parentLocationId } : {}),
  };
}
