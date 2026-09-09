import { DomainValidationError } from '../errors/domain-validation-error.js';
import type { EntityId } from '../ids/entity-id.js';
import type { EntityScope } from '../entity/entity-scope.js';
import {
  resolveEntityIdentity,
  type CreativeEntityIdentity,
  type CreativeEntityLifecycle,
} from '../entity/entity-identity.js';
import type { LifecycleState } from '../lifecycle/lifecycle-state.js';
import { createTemporalReference, type TemporalReference } from '../temporal/temporal-reference.js';

/**
 * Foundational CreativeEvent — something that occurs or occurred within
 * the creative reality. An event must be allowed to exist without known
 * temporal information (`temporalReference` is optional; when supplied it
 * may itself be the `unknown` variant of `TemporalReference`).
 *
 * Deliberately NOT implemented (later systems): a chronology engine,
 * causal graph, event-dependency graph, Mystery Ledger truth, character/
 * audience knowledge of the event, reveal timing, or historical
 * simulation.
 */
export interface CreativeEvent extends CreativeEntityIdentity<'event'>, CreativeEntityLifecycle {
  readonly title: string;
  readonly description?: string;
  readonly temporalReference?: TemporalReference;
}

export interface CreateCreativeEventInput {
  readonly id?: EntityId;
  readonly scope: EntityScope;
  readonly lifecycle?: LifecycleState;
  readonly title: string;
  readonly description?: string;
  readonly temporalReference?: Parameters<typeof createTemporalReference>[0];
}

function resolveTitle(title: string): string {
  const trimmed = title.trim();
  if (trimmed.length === 0) {
    throw new DomainValidationError(
      'creative_event.title_empty',
      'CreativeEvent.title must not be empty or whitespace-only.',
      'title',
    );
  }
  return trimmed;
}

/**
 * Validates and constructs a well-formed {@link CreativeEvent}. Throws
 * {@link DomainValidationError} for an empty/whitespace-only `title`, an
 * invalid `temporalReference` discriminant/data, or a malformed
 * `id`/`lifecycle`.
 */
export function createCreativeEvent(input: CreateCreativeEventInput): CreativeEvent {
  const identity = resolveEntityIdentity('event', {
    ...(input.id !== undefined ? { id: input.id } : {}),
    scope: input.scope,
    ...(input.lifecycle !== undefined ? { lifecycle: input.lifecycle } : {}),
  });

  return {
    ...identity,
    title: resolveTitle(input.title),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.temporalReference !== undefined
      ? { temporalReference: createTemporalReference(input.temporalReference) }
      : {}),
  };
}
