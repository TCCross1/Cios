import { DomainValidationError } from '../errors/domain-validation-error.js';
import {
  createUtcTimestamp,
  isUtcTimestamp,
  nowAsUtcTimestamp,
  type UtcTimestamp,
} from './utc-timestamp.js';

/**
 * Shared `createdAt`/`updatedAt` resolution and ordering-invariant
 * enforcement used by every domain type that carries both timestamps
 * (`CreativeUniverse`, `CreativeWork`, and the `CreativeEntity`
 * foundation — Directive 003R, sections 4/5/9). Internal to the
 * `temporal/` module — not part of the package's public API; each
 * calling module supplies its own `errorScope` so validation-error codes
 * remain specific to the type being constructed (e.g.
 * `creative_universe.updated_at_before_created_at`).
 *
 * Rules:
 * - `createdAt` defaults to the current UTC instant when omitted.
 * - `updatedAt` defaults to the resolved `createdAt` when omitted.
 * - Both are validated (a pre-branded `UtcTimestamp` is accepted as-is —
 *   `isUtcTimestamp` always re-validates it; a plain string is parsed).
 * - `updatedAt` must not precede `createdAt`; this is a deterministic,
 *   string-lexicographic comparison (safe because `UtcTimestamp` is a
 *   fixed-width, zero-padded, strict ISO-8601 UTC instant, so
 *   lexicographic order matches chronological order exactly).
 */
export interface ResolvedTimestampPair {
  readonly createdAt: UtcTimestamp;
  readonly updatedAt: UtcTimestamp;
}

export function resolveTimestampPair(
  input: {
    readonly createdAt?: UtcTimestamp | string;
    readonly updatedAt?: UtcTimestamp | string;
  },
  errorScope: string,
): ResolvedTimestampPair {
  const createdAt = resolveSingleTimestamp(input.createdAt);
  const updatedAt =
    input.updatedAt === undefined ? createdAt : resolveSingleTimestamp(input.updatedAt);

  if (updatedAt < createdAt) {
    throw new DomainValidationError(
      `${errorScope}.updated_at_before_created_at`,
      `updatedAt (${updatedAt}) must not precede createdAt (${createdAt}).`,
      'updatedAt',
    );
  }

  return { createdAt, updatedAt };
}

function resolveSingleTimestamp(value: UtcTimestamp | string | undefined): UtcTimestamp {
  if (value === undefined) {
    return nowAsUtcTimestamp();
  }
  return isUtcTimestamp(value) ? value : createUtcTimestamp(value);
}
