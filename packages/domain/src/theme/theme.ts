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
 * Foundational Theme — first-class because CIOS will later connect
 * thematic meaning across entities, works, Story Genome, and production
 * structure. Deliberately NOT implemented (later systems): theme
 * scoring, Story Genome, thematic analysis, AI interpretation, or
 * emotional mapping.
 */
export interface Theme extends CreativeEntityIdentity<'theme'>, CreativeEntityLifecycle {
  readonly name: string;
  readonly description?: string;
}

export interface CreateThemeInput {
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
      'theme.name_empty',
      'Theme.name must not be empty or whitespace-only.',
      'name',
    );
  }
  return trimmed;
}

/**
 * Validates and constructs a well-formed {@link Theme}. Throws {@link
 * DomainValidationError} for an empty/whitespace-only `name` or a
 * malformed `id`/`lifecycle`.
 */
export function createTheme(input: CreateThemeInput): Theme {
  const identity = resolveEntityIdentity('theme', {
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
