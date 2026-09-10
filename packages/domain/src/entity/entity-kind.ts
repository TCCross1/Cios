/**
 * The closed set of foundational creative-entity subtypes implemented by
 * Directive 003 (as remediated by Directive 003R). A deterministic
 * discriminant — every concrete entity type (`Character`, `Location`,
 * ...) fixes its own `entityKind` literal at construction time, so an
 * entity can never accidentally misidentify its own subtype (see
 * `entity-identity.ts`).
 *
 * `'object'` is the canonical literal for the `CreativeObject` subtype.
 * The TypeScript interface/type is named `CreativeObject` (not `Object`)
 * to avoid colliding with JavaScript's built-in `Object`, but that
 * naming concern applies only to the type identifier — the `EntityKind`
 * string value itself is the directive-required `'object'`, with no
 * competing `'creative-object'` literal.
 */
export type EntityKind =
  'character' | 'location' | 'object' | 'faction' | 'event' | 'concept' | 'theme' | 'rule';

const ENTITY_KINDS: ReadonlySet<EntityKind> = new Set([
  'character',
  'location',
  'object',
  'faction',
  'event',
  'concept',
  'theme',
  'rule',
]);

/** Runtime type guard for `EntityKind`. */
export function isEntityKind(value: unknown): value is EntityKind {
  return typeof value === 'string' && ENTITY_KINDS.has(value as EntityKind);
}
