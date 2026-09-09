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
 * Foundational Rule — a meaningful world, narrative, or creator-defined
 * creative constraint (e.g. "magic cannot resurrect the dead",
 * "communication requires physical relays").
 *
 * CRITICAL INVARIANT: THE EXISTENCE OF A RULE ENTITY DOES NOT MAKE THE
 * RULE CANON. `Rule` intentionally carries no Canon-authority field or
 * state (no `canonState`, `canonStatus`, or equivalent) — whether a given
 * Rule is authoritative creative truth is entirely the responsibility of
 * a future, separate Canon authority system layered on top of entities
 * that already exist, never merged into the entity itself. See
 * `docs/architecture/creative-domain-model.md`.
 */
export interface Rule extends CreativeEntityIdentity<'rule'>, CreativeEntityLifecycle {
  readonly name: string;
  readonly description?: string;
}

export interface CreateRuleInput {
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
      'rule.name_empty',
      'Rule.name must not be empty or whitespace-only.',
      'name',
    );
  }
  return trimmed;
}

/**
 * Validates and constructs a well-formed {@link Rule}. Throws {@link
 * DomainValidationError} for an empty/whitespace-only `name` or a
 * malformed `id`/`lifecycle`.
 */
export function createRule(input: CreateRuleInput): Rule {
  const identity = resolveEntityIdentity('rule', {
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
