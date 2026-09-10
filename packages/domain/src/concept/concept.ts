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
 * Foundational Concept — an addressable abstract creative idea requiring
 * first-class identity (e.g. a curse, a ritual, a prophecy, a doctrine,
 * an economic system, a political philosophy, an unexplained phenomenon,
 * a metaphysical principle).
 *
 * Concept MUST NOT become a generic fallback for every unmodeled object.
 * If something has a more specific foundational kind (Character,
 * Location, CreativeObject, Faction, CreativeEvent, Theme, Rule), model
 * it as that kind — reach for `Concept` only when the idea itself, not a
 * concrete entity, needs identity. `name` is always identical to
 * `CreativeEntityIdentity.displayName` (Directive 003R, section 8).
 */
export interface Concept extends CreativeEntityIdentity<'concept'>, CreativeEntityLifecycle {
  readonly name: string;
  readonly description?: string;
}

export interface CreateConceptInput {
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
    code: 'concept.name_empty',
    message: 'Concept.name must not be empty or whitespace-only.',
    field: 'name',
  });
}

/**
 * Validates and constructs a well-formed, runtime-frozen {@link Concept}.
 * Throws {@link DomainValidationError} for an empty/whitespace-only
 * `name` or a malformed `id`/`lifecycleState`/`createdAt`/`updatedAt`.
 */
export function createConcept(input: CreateConceptInput): Concept {
  const name = resolveName(input.name);
  const identity = resolveEntityIdentity('concept', {
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
