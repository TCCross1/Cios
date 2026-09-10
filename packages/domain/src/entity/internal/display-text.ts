import { DomainValidationError } from '../../errors/domain-validation-error.js';

/**
 * Shared canonical display-text normalization used by every concrete
 * entity subtype's required name/title field (and, in turn, as the
 * value passed to `CreativeEntityIdentity.displayName` — Directive 003R,
 * sections 8/15). Each subtype's `name`/`title` accessor and
 * `displayName` are always derived from this single resolved value, so
 * they can never independently diverge.
 *
 * Deliberately narrow and domain-specific (not a generic `utils`/
 * `common`/`helpers` dumping ground): this module only normalizes the
 * one shape of text every subtype already required (trim, reject
 * empty-after-trim), with each call site supplying its own
 * subtype-specific error code/message/field so validation errors remain
 * precise. Internal to `entity/` subtype modules — not exported from the
 * package's public API.
 */
export interface DisplayTextError {
  readonly code: string;
  readonly message: string;
  readonly field: string;
}

export function resolveDisplayText(value: string, error: DisplayTextError): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    throw new DomainValidationError(error.code, error.message, error.field);
  }
  return trimmed;
}
