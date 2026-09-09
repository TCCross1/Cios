import { randomUUID } from 'node:crypto';
import { DomainValidationError } from '../errors/domain-validation-error.js';
import { isUuidV4 } from './id-format.js';

declare const universeIdBrand: unique symbol;

/**
 * Identifies exactly one {@link CreativeUniverse}. A nominal (branded)
 * string type: structurally identical branded ID types (e.g. `WorkId`,
 * `EntityId`) are not mutually assignable, so a `WorkId` cannot be passed
 * where a `UniverseId` is required without an explicit, intentional
 * conversion. See `docs/architecture/creative-domain-model.md` for the
 * identifier strategy rationale.
 */
export type UniverseId = string & { readonly [universeIdBrand]: true };

/**
 * Validates `raw` as a `UniverseId`. Throws {@link DomainValidationError}
 * (never returns a placeholder) when `raw` is not a syntactically valid
 * identifier.
 */
export function createUniverseId(raw: string): UniverseId {
  if (!isUuidV4(raw)) {
    throw new DomainValidationError(
      'universe_id.malformed',
      `UniverseId must be a valid UUID v4 string, received: ${JSON.stringify(raw)}.`,
      'id',
    );
  }
  return raw as UniverseId;
}

/** Generates a new, valid, randomly assigned `UniverseId`. */
export function generateUniverseId(): UniverseId {
  return createUniverseId(randomUUID());
}

/** Runtime type guard for `UniverseId`. */
export function isUniverseId(value: unknown): value is UniverseId {
  return typeof value === 'string' && isUuidV4(value);
}
