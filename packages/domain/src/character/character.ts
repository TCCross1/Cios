import { DomainValidationError } from '../errors/domain-validation-error.js';
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
 * Foundational Character. Composes the {@link CreativeEntityIdentity}
 * foundation with only stable, non-speculative content: identity, name,
 * optional aliases, optional short description. `name` is Character's
 * canonical display field — it is always identical to
 * `CreativeEntityIdentity.displayName` (Directive 003R, section 8).
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
  readonly lifecycleState?: LifecycleState;
  readonly createdAt?: UtcTimestamp | string;
  readonly updatedAt?: UtcTimestamp | string;
  readonly name: string;
  readonly aliases?: readonly string[];
  readonly description?: string;
}

function resolveName(name: string): string {
  return resolveDisplayText(name, {
    code: 'character.name_empty',
    message: 'Character.name must not be empty or whitespace-only.',
    field: 'name',
  });
}

/**
 * Deterministic alias normalization: each alias is trimmed, an
 * empty-after-trim alias is rejected (rather than silently dropped —
 * malformed input must fail closed), and exact-duplicate aliases are
 * removed, preserving first-occurrence order. Case is intentionally
 * preserved (never folded) because creative aliases are case-sensitive
 * proper nouns (e.g. "Doc" vs. "DOC" may be meaningfully different
 * in-universe). The returned array is always a fresh, frozen copy — the
 * caller's original array (if any) is never retained by reference, and
 * mutating it after construction never affects the constructed
 * `Character` (Directive 003R, section 12).
 */
function resolveAliases(aliases: readonly string[] | undefined): readonly string[] {
  if (aliases === undefined) {
    return Object.freeze([]);
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
  return Object.freeze(normalized);
}

/**
 * Validates and constructs a well-formed, runtime-frozen {@link
 * Character}. Throws {@link DomainValidationError} for an
 * empty/whitespace-only `name`, an empty/whitespace-only alias, or a
 * malformed `id`/`lifecycleState`/`createdAt`/`updatedAt`.
 */
export function createCharacter(input: CreateCharacterInput): Character {
  const name = resolveName(input.name);
  const identity = resolveEntityIdentity('character', {
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
    aliases: resolveAliases(input.aliases),
    ...(input.description !== undefined ? { description: input.description } : {}),
  });
}
