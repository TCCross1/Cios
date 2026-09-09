import { DomainValidationError } from '../errors/domain-validation-error.js';
import { createUtcTimestamp, isUtcTimestamp, type UtcTimestamp } from './utc-timestamp.js';

/** A creative event anchored to a real-world UTC instant. */
export interface ExactTemporalReference {
  readonly kind: 'exact';
  readonly timestamp: UtcTimestamp;
}

/**
 * A creative event dated in in-universe/fictional terms that cannot be
 * mapped to a real-world instant (e.g. "the third year of the Long
 * Winter", "14th of Harvestmoon").
 */
export interface TextualTemporalReference {
  readonly kind: 'textual';
  readonly value: string;
}

/**
 * A creative event positioned only relative to another point, without an
 * absolute date (e.g. "three days after the coronation", "shortly before
 * the war").
 */
export interface RelativeTemporalReference {
  readonly kind: 'relative';
  readonly label: string;
}

/** A creative event whose timing is not yet known/determined. */
export interface UnknownTemporalReference {
  readonly kind: 'unknown';
}

/**
 * When something occurs within the creative reality. Deliberately a
 * minimal, closed, extensible-by-directive discriminated union — CIOS
 * cannot assume Gregorian chronology, so this must not collapse into a
 * single `Date`/timestamp field. This is distinct from narrative
 * position (see `docs/architecture/creative-domain-model.md`, "Narrative
 * Position Decision"), which answers a different question: not "when did
 * this occur in-universe", but "when does the audience encounter it".
 *
 * No chronology engine, causal graph, era system, or date arithmetic
 * across fictional calendars is implemented here — only a minimal,
 * validated shape for each supported kind of temporal knowledge.
 */
export type TemporalReference =
  | ExactTemporalReference
  | TextualTemporalReference
  | RelativeTemporalReference
  | UnknownTemporalReference;

/**
 * Validates and normalizes `input` into a well-formed {@link
 * TemporalReference}. Throws {@link DomainValidationError} for an
 * unrecognized discriminant or invalid per-kind data (never silently
 * drops or defaults invalid input).
 */
export function createTemporalReference(
  input:
    | { readonly kind: 'exact'; readonly timestamp: string }
    | { readonly kind: 'textual'; readonly value: string }
    | { readonly kind: 'relative'; readonly label: string }
    | { readonly kind: 'unknown' },
): TemporalReference {
  switch (input.kind) {
    case 'exact': {
      if (isUtcTimestamp(input.timestamp)) {
        return { kind: 'exact', timestamp: input.timestamp };
      }
      return { kind: 'exact', timestamp: createUtcTimestamp(input.timestamp) };
    }
    case 'textual': {
      const value = input.value.trim();
      if (value.length === 0) {
        throw new DomainValidationError(
          'temporal_reference.textual_empty',
          'Textual temporal reference value must not be empty or whitespace-only.',
          'value',
        );
      }
      return { kind: 'textual', value };
    }
    case 'relative': {
      const label = input.label.trim();
      if (label.length === 0) {
        throw new DomainValidationError(
          'temporal_reference.relative_label_empty',
          'Relative temporal reference label must not be empty or whitespace-only.',
          'label',
        );
      }
      return { kind: 'relative', label };
    }
    case 'unknown':
      return { kind: 'unknown' };
    default: {
      const unreachable: never = input;
      throw new DomainValidationError(
        'temporal_reference.invalid_discriminant',
        `Unrecognized temporal reference kind: ${JSON.stringify((unreachable as { kind: unknown }).kind)}.`,
        'kind',
      );
    }
  }
}
