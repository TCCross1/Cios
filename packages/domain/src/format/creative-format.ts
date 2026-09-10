import { DomainValidationError } from '../errors/domain-validation-error.js';

/**
 * The creative medium/format a {@link CreativeWork} is produced for. A
 * deliberately closed, deterministic set (Constitution, section F) — CIOS
 * must know exactly what formats it understands rather than accepting an
 * arbitrary string.
 *
 * This set mirrors the media CIOS's master context names as in-scope:
 * novels, feature films, television series, sitcoms, animation, narrative
 * games, role-playing games, graphic narratives, audio formats
 * (audiobooks/audio drama), interactive/branching formats, and `other`
 * for a creative work whose medium does not yet map to one of these
 * literals. "Future creative formats" are added by deliberately
 * extending this union and `CREATIVE_FORMATS` in a later directive —
 * never by widening this type to a bare `string`.
 *
 * This is the exact, canonical vocabulary required by Directive 003 (as
 * remediated by Directive 003R). There are no aliases: earlier,
 * unauthorized abbreviations (`television`, `rpg`) are not accepted —
 * there are no production consumers of this package yet, so a single
 * clean vocabulary is preferred over preserving a second, competing set
 * of literals.
 */
export type CreativeFormat =
  | 'novel'
  | 'feature-film'
  | 'television-series'
  | 'sitcom'
  | 'animation'
  | 'narrative-game'
  | 'role-playing-game'
  | 'graphic-narrative'
  | 'audio'
  | 'interactive'
  | 'other';

const CREATIVE_FORMATS: ReadonlySet<CreativeFormat> = new Set([
  'novel',
  'feature-film',
  'television-series',
  'sitcom',
  'animation',
  'narrative-game',
  'role-playing-game',
  'graphic-narrative',
  'audio',
  'interactive',
  'other',
]);

/** Runtime type guard for `CreativeFormat`. */
export function isCreativeFormat(value: unknown): value is CreativeFormat {
  return typeof value === 'string' && CREATIVE_FORMATS.has(value as CreativeFormat);
}

/**
 * Validates `raw` as a `CreativeFormat`. Throws {@link
 * DomainValidationError} for any unsupported value.
 */
export function assertCreativeFormat(raw: string): CreativeFormat {
  if (!isCreativeFormat(raw)) {
    throw new DomainValidationError(
      'creative_format.unsupported',
      `Unsupported creative format: ${JSON.stringify(raw)}. Supported values: ${[...CREATIVE_FORMATS].join(', ')}.`,
      'format',
    );
  }
  return raw;
}
