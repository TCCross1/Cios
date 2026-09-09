import { DomainValidationError } from '../errors/domain-validation-error.js';

declare const utcTimestampBrand: unique symbol;

/**
 * A point in real-world time, serialized as a strict ISO-8601 UTC
 * instant string (e.g. `"2026-09-09T22:42:00.000Z"`). Branded so it is
 * not casually interchangeable with an arbitrary `string`.
 *
 * This intentionally does NOT model fictional/in-universe chronology —
 * that is `TemporalReference`'s job. `UtcTimestamp` is only used for
 * real-world record-keeping (e.g. `CreativeUniverse.createdAt`) and for
 * the `exact` variant of `TemporalReference` when a creative event is
 * deliberately anchored to a real-world instant.
 */
export type UtcTimestamp = string & { readonly [utcTimestampBrand]: true };

// Strict ISO-8601 UTC instant: YYYY-MM-DDTHH:mm:ss.sssZ. Deliberately
// stricter than `Date.parse`, which accepts many loosely-formatted and
// locale-ambiguous strings CIOS should never treat as canonical.
const UTC_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

function isSyntacticallyValidUtcTimestamp(value: string): boolean {
  if (!UTC_TIMESTAMP_PATTERN.test(value)) {
    return false;
  }
  return !Number.isNaN(Date.parse(value));
}

/** Runtime type guard for `UtcTimestamp`. */
export function isUtcTimestamp(value: unknown): value is UtcTimestamp {
  return typeof value === 'string' && isSyntacticallyValidUtcTimestamp(value);
}

/**
 * Validates `raw` as a `UtcTimestamp`. Throws {@link DomainValidationError}
 * (never returns a placeholder) when `raw` is not a syntactically valid,
 * real, strict ISO-8601 UTC instant.
 */
export function createUtcTimestamp(raw: string): UtcTimestamp {
  if (!isSyntacticallyValidUtcTimestamp(raw)) {
    throw new DomainValidationError(
      'utc_timestamp.malformed',
      `Timestamp must be a strict ISO-8601 UTC instant (e.g. "2026-01-01T00:00:00.000Z"), received: ${JSON.stringify(raw)}.`,
      'timestamp',
    );
  }
  return raw as UtcTimestamp;
}

/** The current instant, as a `UtcTimestamp`. */
export function nowAsUtcTimestamp(): UtcTimestamp {
  return createUtcTimestamp(new Date().toISOString());
}
