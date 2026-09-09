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

const scope = createEntityScope({ kind: 'universe', universeId: generateUniverseId() });

describe('entity subtype/kind consistency', () => {
  it('Character is always kind "character"', () => {
    const character = createCharacter({ scope, name: 'Ada' });
    expect(character.kind).toBe('character');
  });

  it('Location is always kind "location"', () => {
    const location = createLocation({ scope, name: 'The Archive' });
    expect(location.kind).toBe('location');
  });

  it('CreativeObject is always kind "creative-object"', () => {
    const object = createCreativeObject({ scope, name: 'The Signal Lantern' });
    expect(object.kind).toBe('creative-object');
  });

  it('Faction is always kind "faction"', () => {
    const faction = createFaction({ scope, name: 'The Quiet Order' });
    expect(faction.kind).toBe('faction');
  });

  it('CreativeEvent is always kind "event"', () => {
    const event = createCreativeEvent({ scope, title: 'The Long Winter Begins' });
    expect(event.kind).toBe('event');
  });

  it('Concept is always kind "concept"', () => {
    const concept = createConcept({ scope, name: 'The Binding Oath' });
    expect(concept.kind).toBe('concept');
  });

  it('Theme is always kind "theme"', () => {
    const theme = createTheme({ scope, name: 'Found Family' });
    expect(theme.kind).toBe('theme');
  });

  it('Rule is always kind "rule"', () => {
    const rule = createRule({ scope, name: 'Magic cannot resurrect the dead' });
    expect(rule.kind).toBe('rule');
  });

  it('no supported construction API accepts a caller-supplied kind override', () => {
    // Each `createX` function signature fixes its own `kind` literal; none
    // accepts a `kind` property in its input at all, so there is no
    // supported way to construct e.g. a Character that reports itself as
    // kind "theme" — this is a compile-time guarantee, not merely a
    // runtime one (see tests/type-safety.test.ts).
    const character = createCharacter({ scope, name: 'Nobody' });
    const theme = createTheme({ scope, name: 'Nothing' });
    expect(character.kind).not.toBe(theme.kind);
  });
});
