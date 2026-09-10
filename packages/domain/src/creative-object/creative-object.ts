import type { EntityId } from '../ids/entity-id.js';
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
 * Foundational CreativeObject — a named, addressable in-universe object
 * (named deliberately `CreativeObject`, not `Object`, to avoid colliding
 * with JavaScript's built-in `Object`; the `EntityKind` literal itself is
 * the directive-required `'object'` — see `entity/entity-kind.ts`).
 * Deliberately NOT implemented (later systems): ownership history,
 * inventory, physical simulation, symbolism, artifact provenance, or
 * item mechanics. `name` is always identical to
 * `CreativeEntityIdentity.displayName` (Directive 003R, section 8).
 */
export interface CreativeObject extends CreativeEntityIdentity<'object'>, CreativeEntityLifecycle {
  readonly name: string;
  readonly description?: string;
}

export interface CreateCreativeObjectInput {
  readonly id?: EntityId;
  readonly scope: EntityScope;
  readonly lifecycleState?: LifecycleState;
  readonly createdAt?: UtcTimestamp | string;
  readonly updatedAt?: UtcTimestamp | string;
  readonly name: string;
  readonly description?: string;
}

function resolveName(name: string): string {
  return resolveDisplayText(name, {
    code: 'creative_object.name_empty',
    message: 'CreativeObject.name must not be empty or whitespace-only.',
    field: 'name',
  });
}

/**
 * Validates and constructs a well-formed, runtime-frozen {@link
 * CreativeObject}. Throws {@link DomainValidationError} for an
 * empty/whitespace-only `name` or a malformed
 * `id`/`lifecycleState`/`createdAt`/`updatedAt`.
 */
export function createCreativeObject(input: CreateCreativeObjectInput): CreativeObject {
  const name = resolveName(input.name);
  const identity = resolveEntityIdentity('object', {
    ...(input.id !== undefined ? { id: input.id } : {}),
    scope: input.scope,
    ...(input.lifecycleState !== undefined ? { lifecycleState: input.lifecycleState } : {}),
    ...(input.createdAt !== undefined ? { createdAt: input.createdAt } : {}),
    ...(input.updatedAt !== undefined ? { updatedAt: input.updatedAt } : {}),
    displayName: name,
  });

  return Object.freeze({
    ...identity,
    name,
    ...(input.description !== undefined ? { description: input.description } : {}),
  });
}
