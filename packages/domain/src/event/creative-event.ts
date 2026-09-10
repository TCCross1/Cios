import type { EntityId } from '../ids/entity-id.js';
import type { EntityScope } from '../entity/entity-scope.js';
import {
  resolveEntityIdentity,
  type CreativeEntityIdentity,
  type CreativeEntityLifecycle,
} from '../entity/entity-identity.js';
import type { LifecycleState } from '../lifecycle/lifecycle-state.js';
import type { UtcTimestamp } from '../temporal/utc-timestamp.js';
import { createTemporalReference, type TemporalReference } from '../temporal/temporal-reference.js';
import { resolveDisplayText } from '../entity/internal/display-text.js';

/**
 * Foundational CreativeEvent — something that occurs or occurred within
 * the creative reality. An event must be allowed to exist without known
 * temporal information (`temporalReference` is optional; when supplied it
 * may itself be the `unknown` variant of `TemporalReference`).
 *
 * Deliberately NOT implemented (later systems): a chronology engine,
 * causal graph, event-dependency graph, Mystery Ledger truth, character/
 * audience knowledge of the event, reveal timing, or historical
 * simulation. `title` is always identical to
 * `CreativeEntityIdentity.displayName` (Directive 003R, section 8).
 */
export interface CreativeEvent extends CreativeEntityIdentity<'event'>, CreativeEntityLifecycle {
  readonly title: string;
  readonly description?: string;
  readonly temporalReference?: TemporalReference;
}

export interface CreateCreativeEventInput {
  readonly id?: EntityId;
  readonly scope: EntityScope;
  readonly lifecycleState?: LifecycleState;
  readonly createdAt?: UtcTimestamp | string;
  readonly updatedAt?: UtcTimestamp | string;
  readonly title: string;
  readonly description?: string;
  readonly temporalReference?: Parameters<typeof createTemporalReference>[0];
}

function resolveTitle(title: string): string {
  return resolveDisplayText(title, {
    code: 'creative_event.title_empty',
    message: 'CreativeEvent.title must not be empty or whitespace-only.',
    field: 'title',
  });
}

/**
 * Validates and constructs a well-formed, runtime-frozen {@link
 * CreativeEvent}. Throws {@link DomainValidationError} for an
 * empty/whitespace-only `title`, an invalid `temporalReference`
 * discriminant/data, or a malformed
 * `id`/`lifecycleState`/`createdAt`/`updatedAt`.
 */
export function createCreativeEvent(input: CreateCreativeEventInput): CreativeEvent {
  const title = resolveTitle(input.title);
  const identity = resolveEntityIdentity('event', {
    ...(input.id !== undefined ? { id: input.id } : {}),
    scope: input.scope,
    ...(input.lifecycleState !== undefined ? { lifecycleState: input.lifecycleState } : {}),
    ...(input.createdAt !== undefined ? { createdAt: input.createdAt } : {}),
    ...(input.updatedAt !== undefined ? { updatedAt: input.updatedAt } : {}),
    displayName: title,
  });

  return Object.freeze({
    ...identity,
    title,
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.temporalReference !== undefined
      ? { temporalReference: createTemporalReference(input.temporalReference) }
      : {}),
  });
}
