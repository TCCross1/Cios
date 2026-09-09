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
 * Foundational Character. Composes the {@link CreativeEntityIdentity}
 * foundation with only stable, non-speculative content: identity, name,
 * optional aliases, optional short description.
 *
 * Deliberately NOT implemented (later systems): Character Consciousness,
 * a psychology model, knowledge states, a goals engine, a secrets engine,
 * emotional arcs, personality inference, a relationship graph, AI-
 * generated personality, or a character timeline.
 */
export interface Character extends CreativeEntityIdentity<'character'>, CreativeEntityLifecycle {
  readonly name: string;
  readonly aliases: readonly string[];
  readonly description?: string;
}

export interface CreateCharacterInput {
  readonly id?: EntityId;
  readonly scope: EntityScope;
  readonly lifecycle?: LifecycleState;
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly description?: string;
}

function resolveName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    throw new DomainValidationError(
      'character.name_empty',
      'Character.name must not be empty or whitespace-only.',
      'name',
    );
  }
  return trimmed;
}

/**
 * Deterministic alias normalization: each alias is trimmed, an
 * empty-after-trim alias is rejected (rather than silently dropped —
 * malformed input must fail closed), and exact-duplicate aliases are
 * removed, preserving first-occurrence order. Case is intentionally
 * preserved (never folded) because creative aliases are case-sensitive
 * proper nouns (e.g. "Doc" vs. "DOC" may be meaningfully different
 * in-universe).
 */
function resolveAliases(aliases: readonly string[] | undefined): readonly string[] {
  if (aliases === undefined) {
    return [];
  }
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const alias of aliases) {
    const trimmed = alias.trim();
    if (trimmed.length === 0) {
      throw new DomainValidationError(
        'character.alias_empty',
        'Character alias must not be empty or whitespace-only.',
        'aliases',
      );
    }
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      normalized.push(trimmed);
    }
  }
  return normalized;
}

/**
 * Validates and constructs a well-formed {@link Character}. Throws {@link
 * DomainValidationError} for an empty/whitespace-only `name`, an
 * empty/whitespace-only alias, or a malformed `id`/`lifecycle`.
 */
export function createCharacter(input: CreateCharacterInput): Character {
  const identity = resolveEntityIdentity('character', {
    ...(input.id !== undefined ? { id: input.id } : {}),
    scope: input.scope,
    ...(input.lifecycle !== undefined ? { lifecycle: input.lifecycle } : {}),
  });

  return {
    ...identity,
    name: resolveName(input.name),
    aliases: resolveAliases(input.aliases),
    ...(input.description !== undefined ? { description: input.description } : {}),
  };
}
