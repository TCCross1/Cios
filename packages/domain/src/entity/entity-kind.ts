/**
 * The closed set of foundational creative-entity subtypes implemented by
 * Directive 003. A deterministic discriminant — every concrete entity
 * type (`Character`, `Location`, ...) fixes its own `kind` literal at
 * construction time, so an entity can never accidentally misidentify its
 * own subtype (see `entity-identity.ts`).
 */
export type EntityKind =
  'character' | 'location' | 'creative-object' | 'faction' | 'event' | 'concept' | 'theme' | 'rule';

const ENTITY_KINDS: ReadonlySet<EntityKind> = new Set([
  'character',
  'location',
  'creative-object',
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
