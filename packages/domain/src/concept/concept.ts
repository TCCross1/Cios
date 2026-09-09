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
 * Foundational Concept — an addressable abstract creative idea requiring
 * first-class identity (e.g. a curse, a ritual, a prophecy, a doctrine,
 * an economic system, a political philosophy, an unexplained phenomenon,
 * a metaphysical principle).
 *
 * Concept MUST NOT become a generic fallback for every unmodeled object.
 * If something has a more specific foundational kind (Character,
 * Location, CreativeObject, Faction, CreativeEvent, Theme, Rule), model
 * it as that kind — reach for `Concept` only when the idea itself, not a
 * concrete entity, needs identity.
 */
export interface Concept extends CreativeEntityIdentity<'concept'>, CreativeEntityLifecycle {
  readonly name: string;
  readonly description?: string;
}

export interface CreateConceptInput {
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
      'concept.name_empty',
      'Concept.name must not be empty or whitespace-only.',
      'name',
    );
  }
  return trimmed;
}

/**
 * Validates and constructs a well-formed {@link Concept}. Throws {@link
 * DomainValidationError} for an empty/whitespace-only `name` or a
 * malformed `id`/`lifecycle`.
 */
export function createConcept(input: CreateConceptInput): Concept {
  const identity = resolveEntityIdentity('concept', {
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
