import { randomUUID } from 'node:crypto';
import { DomainValidationError } from '../errors/domain-validation-error.js';
import { isUuidV4 } from './id-format.js';

declare const workIdBrand: unique symbol;

/**
 * Identifies exactly one {@link CreativeWork}. See `UniverseId` for the
 * branding rationale — a `WorkId` is not assignable where a `UniverseId`
 * or `EntityId` is expected, even though all three share the same runtime
 * string shape.
 */
export type WorkId = string & { readonly [workIdBrand]: true };

/**
 * Validates `raw` as a `WorkId`. Throws {@link DomainValidationError} (never
 * returns a placeholder) when `raw` is not a syntactically valid
 * identifier.
 */
export function createWorkId(raw: string): WorkId {
  if (!isUuidV4(raw)) {
    throw new DomainValidationError(
      'work_id.malformed',
      `WorkId must be a valid UUID v4 string, received: ${JSON.stringify(raw)}.`,
      'id',
    );
  }
  return raw as WorkId;
}

/** Generates a new, valid, randomly assigned `WorkId`. */
export function generateWorkId(): WorkId {
  return createWorkId(randomUUID());
}

/** Runtime type guard for `WorkId`. */
export function isWorkId(value: unknown): value is WorkId {
  return typeof value === 'string' && isUuidV4(value);
}
