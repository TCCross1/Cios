import { DomainValidationError } from '../errors/domain-validation-error.js';
import type { EntityId } from '../ids/entity-id.js';
import type { EntityScope } from '../entity/entity-scope.js';
import {
  resolveEntityIdentity,
  type CreativeEntityIdentity,
  type CreativeEntityLifecycle,
} from '../entity/entity-identity.js';
import type { LifecycleState } from '../lifecycle/lifecycle-state.js';

/**
 * Foundational CreativeObject — a named, addressable in-universe object
 * (named deliberately `CreativeObject`, not `Object`, to avoid colliding
 * with JavaScript's built-in `Object`). Deliberately NOT implemented
 * (later systems): ownership history, inventory, physical simulation,
 * symbolism, artifact provenance, or item mechanics.
 */
export interface CreativeObject
  extends CreativeEntityIdentity<'creative-object'>, CreativeEntityLifecycle {
  readonly name: string;
  readonly description?: string;
}

export interface CreateCreativeObjectInput {
  readonly id?: EntityId;
  readonly scope: EntityScope;
  readonly lifecycle?: LifecycleState;
  readonly name: string;
  readonly description?: string;
}

function resolveName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new DomainValidationError(
      'creative_object.name_empty',
      'CreativeObject.name must not be empty or whitespace-only.',
      'name',
    );
  }
  return trimmed;
}

/**
 * Validates and constructs a well-formed {@link CreativeObject}. Throws
 * {@link DomainValidationError} for an empty/whitespace-only `name` or a
 * malformed `id`/`lifecycle`.
 */
export function createCreativeObject(input: CreateCreativeObjectInput): CreativeObject {
  const identity = resolveEntityIdentity('creative-object', {
    ...(input.id !== undefined ? { id: input.id } : {}),
    scope: input.scope,
    ...(input.lifecycle !== undefined ? { lifecycle: input.lifecycle } : {}),
  });

  return {
    ...identity,
    name: resolveName(input.name),
    ...(input.description !== undefined ? { description: input.description } : {}),
  };
}
