import { DomainValidationError } from '../errors/domain-validation-error.js';

/**
 * The creative medium/format a {@link CreativeWork} is produced for. A
 * deliberately closed, deterministic set (Constitution, section F) — CIOS
 * must know exactly what formats it understands rather than accepting an
 * arbitrary string.
 *
 * This set mirrors the media CIOS's master context names as in-scope
 * (novels, feature films, television, sitcoms, animation, narrative
 * games, RPGs, graphic narratives). "Future creative formats" are added
 * by deliberately extending this union and `CREATIVE_FORMATS` in a later
 * directive — never by widening this type to a bare `string`.
 */
export type CreativeFormat =
  | 'novel'
  | 'feature-film'
  | 'television'
  | 'sitcom'
  | 'animation'
  | 'narrative-game'
  | 'rpg'
  | 'graphic-narrative';

const CREATIVE_FORMATS: ReadonlySet<CreativeFormat> = new Set([
  'novel',
  'feature-film',
  'television',
  'sitcom',
  'animation',
  'narrative-game',
  'rpg',
  'graphic-narrative',
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
