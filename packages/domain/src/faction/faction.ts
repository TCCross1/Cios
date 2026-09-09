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
 * Foundational Faction.
 *
 * MODELING DECISION (Directive 003, section 24): Directive 003 implements
 * only `Faction` — it does NOT introduce a separate `Organization` entity
 * kind. Rationale: at this foundational layer, "Faction" and
 * "Organization" have no materially different future behavior/identity
 * meaning yet — both represent a named group with shared identity,
 * allegiance, or purpose inside the creative reality. Splitting them now
 * would duplicate a concept merely because two words for it exist, which
 * section 24 explicitly forbids. Faction's shape here (identity, name,
 * optional description) makes no assumption about scale, moral alignment,
 * or narrative importance, so an ordinary/mundane organization (e.g. a
 * bakery, a minor bureaucratic department) can be represented as a
 * `Faction` today without turning `Concept` into a dumping ground for it.
 * If a later directive identifies a materially different future need for
 * organizations (e.g. distinct legal/corporate-structure fields that
 * would not make sense on a war-band or cult), that directive can
 * introduce `Organization` as its own first-class kind then — this
 * decision does not preclude that.
 *
 * Deliberately NOT implemented (later systems): membership tracking,
 * hierarchy/rank structure, inter-faction relationships/conflict,
 * resources, or goals.
 */
export interface Faction extends CreativeEntityIdentity<'faction'>, CreativeEntityLifecycle {
  readonly name: string;
  readonly description?: string;
}

export interface CreateFactionInput {
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
      'faction.name_empty',
      'Faction.name must not be empty or whitespace-only.',
      'name',
    );
  }
  return trimmed;
}

/**
 * Validates and constructs a well-formed {@link Faction}. Throws {@link
 * DomainValidationError} for an empty/whitespace-only `name` or a
 * malformed `id`/`lifecycle`.
 */
export function createFaction(input: CreateFactionInput): Faction {
  const identity = resolveEntityIdentity('faction', {
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
