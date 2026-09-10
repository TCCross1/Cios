import { describe, expect, it } from 'vitest';
import {
  createCharacter,
  createLocation,
  createCreativeObject,
  createFaction,
  createCreativeEvent,
  createConcept,
  createTheme,
  createRule,
  createEntityScope,
  generateUniverseId,
} from '../src/index.js';

const universeId = generateUniverseId();
const scope = createEntityScope({ kind: 'universe', universeId });

describe('entity subtype/kind consistency', () => {
  it('Character is always entityKind "character"', () => {
    const character = createCharacter({ scope, name: 'Ada' });
    expect(character.entityKind).toBe('character');
  });

  it('Location is always entityKind "location"', () => {
    const location = createLocation({ scope, name: 'The Archive' });
    expect(location.entityKind).toBe('location');
  });

  it('CreativeObject is always entityKind "object"', () => {
    const object = createCreativeObject({ scope, name: 'The Signal Lantern' });
    expect(object.entityKind).toBe('object');
  });

  it('Faction is always entityKind "faction"', () => {
    const faction = createFaction({ scope, name: 'The Quiet Order' });
    expect(faction.entityKind).toBe('faction');
  });

  it('CreativeEvent is always entityKind "event"', () => {
    const event = createCreativeEvent({ scope, title: 'The Long Winter Begins' });
    expect(event.entityKind).toBe('event');
  });

  it('Concept is always entityKind "concept"', () => {
    const concept = createConcept({ scope, name: 'The Binding Oath' });
    expect(concept.entityKind).toBe('concept');
  });

  it('Theme is always entityKind "theme"', () => {
    const theme = createTheme({ scope, name: 'Found Family' });
    expect(theme.entityKind).toBe('theme');
  });

  it('Rule is always entityKind "rule"', () => {
    const rule = createRule({ scope, name: 'Magic cannot resurrect the dead' });
    expect(rule.entityKind).toBe('rule');
  });

  it('no supported construction API accepts a caller-supplied entityKind override', () => {
    // Each `createX` function signature fixes its own `entityKind` literal;
    // none accepts an `entityKind` property in its input at all, so there
    // is no supported way to construct e.g. a Character that reports
    // itself as entityKind "theme" — this is a compile-time guarantee, not
    // merely a runtime one (see tests/type-safety.test.ts).
    const character = createCharacter({ scope, name: 'Nobody' });
    const theme = createTheme({ scope, name: 'Nothing' });
    expect(character.entityKind).not.toBe(theme.entityKind);
  });

  it('every subtype exposes universeId matching scope.universeId', () => {
    const character = createCharacter({ scope, name: 'Ada' });
    const location = createLocation({ scope, name: 'The Archive' });
    const object = createCreativeObject({ scope, name: 'The Signal Lantern' });
    const faction = createFaction({ scope, name: 'The Quiet Order' });
    const event = createCreativeEvent({ scope, title: 'The Long Winter Begins' });
    const concept = createConcept({ scope, name: 'The Binding Oath' });
    const theme = createTheme({ scope, name: 'Found Family' });
    const rule = createRule({ scope, name: 'Magic cannot resurrect the dead' });

    for (const entity of [character, location, object, faction, event, concept, theme, rule]) {
      expect(entity.universeId).toBe(universeId);
      expect(entity.scope.universeId).toBe(entity.universeId);
    }
  });

  it('every subtype exposes entityId/entityKind/scope/displayName/lifecycleState/createdAt/updatedAt', () => {
    const character = createCharacter({ scope, name: 'Ada' });
    const location = createLocation({ scope, name: 'The Archive' });
    const object = createCreativeObject({ scope, name: 'The Signal Lantern' });
    const faction = createFaction({ scope, name: 'The Quiet Order' });
    const event = createCreativeEvent({ scope, title: 'The Long Winter Begins' });
    const concept = createConcept({ scope, name: 'The Binding Oath' });
    const theme = createTheme({ scope, name: 'Found Family' });
    const rule = createRule({ scope, name: 'Magic cannot resurrect the dead' });

    for (const entity of [character, location, object, faction, event, concept, theme, rule]) {
      expect(typeof entity.entityId).toBe('string');
      expect(typeof entity.entityKind).toBe('string');
      expect(entity.scope).toBeDefined();
      expect(typeof entity.displayName).toBe('string');
      expect(entity.displayName.length).toBeGreaterThan(0);
      expect(typeof entity.lifecycleState).toBe('string');
      expect(entity.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(entity.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      expect(entity.updatedAt >= entity.createdAt).toBe(true);
    }
  });

  it('subtype-specific name/title equals displayName for every subtype', () => {
    const character = createCharacter({ scope, name: 'Ada' });
    const location = createLocation({ scope, name: 'The Archive' });
    const object = createCreativeObject({ scope, name: 'The Signal Lantern' });
    const faction = createFaction({ scope, name: 'The Quiet Order' });
    const event = createCreativeEvent({ scope, title: 'The Long Winter Begins' });
    const concept = createConcept({ scope, name: 'The Binding Oath' });
    const theme = createTheme({ scope, name: 'Found Family' });
    const rule = createRule({ scope, name: 'Magic cannot resurrect the dead' });

    expect(character.name).toBe(character.displayName);
    expect(location.name).toBe(location.displayName);
    expect(object.name).toBe(object.displayName);
    expect(faction.name).toBe(faction.displayName);
    expect(event.title).toBe(event.displayName);
    expect(concept.name).toBe(concept.displayName);
    expect(theme.name).toBe(theme.displayName);
    expect(rule.name).toBe(rule.displayName);
  });
});
