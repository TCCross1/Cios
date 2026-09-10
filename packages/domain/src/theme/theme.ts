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
 * Foundational Theme — first-class because CIOS will later connect
 * thematic meaning across entities, works, Story Genome, and production
 * structure. Deliberately NOT implemented (later systems): theme
 * scoring, Story Genome, thematic analysis, AI interpretation, or
 * emotional mapping. `name` is always identical to
 * `CreativeEntityIdentity.displayName` (Directive 003R, section 8).
 */
export interface Theme extends CreativeEntityIdentity<'theme'>, CreativeEntityLifecycle {
  readonly name: string;
  readonly description?: string;
}

export interface CreateThemeInput {
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
    code: 'theme.name_empty',
    message: 'Theme.name must not be empty or whitespace-only.',
    field: 'name',
  });
}

/**
 * Validates and constructs a well-formed, runtime-frozen {@link Theme}.
 * Throws {@link DomainValidationError} for an empty/whitespace-only
 * `name` or a malformed `id`/`lifecycleState`/`createdAt`/`updatedAt`.
 */
export function createTheme(input: CreateThemeInput): Theme {
  const name = resolveName(input.name);
  const identity = resolveEntityIdentity('theme', {
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
