import { randomUUID } from 'node:crypto';
import { DomainValidationError } from '../errors/domain-validation-error.js';
import { isUuidV4 } from './id-format.js';

declare const entityIdBrand: unique symbol;

/**
 * Identifies exactly one creative entity (a {@link Character}, {@link
 * Location}, {@link CreativeObject}, {@link Faction}, {@link
 * CreativeEvent}, {@link Concept}, {@link Theme}, or {@link Rule}) —
 * regardless of its `EntityKind`. See `UniverseId` for the branding
 * rationale.
 */
export type EntityId = string & { readonly [entityIdBrand]: true };

/**
 * Validates `raw` as an `EntityId`. Throws {@link DomainValidationError}
 * (never returns a placeholder) when `raw` is not a syntactically valid
 * identifier.
 */
export function createEntityId(raw: string): EntityId {
  if (!isUuidV4(raw)) {
    throw new DomainValidationError(
      'entity_id.malformed',
      `EntityId must be a valid UUID v4 string, received: ${JSON.stringify(raw)}.`,
      'id',
    );
  }
  return raw as EntityId;
}

/** Generates a new, valid, randomly assigned `EntityId`. */
export function generateEntityId(): EntityId {
  return createEntityId(randomUUID());
}

/** Runtime type guard for `EntityId`. */
export function isEntityId(value: unknown): value is EntityId {
  return typeof value === 'string' && isUuidV4(value);
}
