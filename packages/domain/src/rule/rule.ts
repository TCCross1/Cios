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
 * `docs/architecture/creative-domain-model.md`. `name` is always
 * identical to `CreativeEntityIdentity.displayName` (Directive 003R,
 * section 8).
 */
export interface Rule extends CreativeEntityIdentity<'rule'>, CreativeEntityLifecycle {
  readonly name: string;
  readonly description?: string;
}

export interface CreateRuleInput {
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
    code: 'rule.name_empty',
    message: 'Rule.name must not be empty or whitespace-only.',
    field: 'name',
  });
}

/**
 * Validates and constructs a well-formed, runtime-frozen {@link Rule}.
 * Throws {@link DomainValidationError} for an empty/whitespace-only
 * `name` or a malformed `id`/`lifecycleState`/`createdAt`/`updatedAt`.
 */
export function createRule(input: CreateRuleInput): Rule {
  const name = resolveName(input.name);
  const identity = resolveEntityIdentity('rule', {
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
