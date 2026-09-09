import { describe, expect, it } from 'vitest';
import {
  createCreativeUniverse,
  createCreativeWork,
  createEntityRef,
  createEntityScope,
  createCharacter,
  createLocation,
  createCreativeEvent,
  generateUniverseId,
} from '../src/index.js';

describe('JSON serialization round-trips', () => {
  it('CreativeUniverse JSON.stringifies and parses back to a plain-data shape', () => {
    const universe = createCreativeUniverse({
      name: 'The Emberlands',
      description: 'Dying stars.',
    });
    const parsed = JSON.parse(JSON.stringify(universe));
    expect(parsed).toEqual({
      id: universe.id,
      name: universe.name,
      description: universe.description,
      createdAt: universe.createdAt,
    });
  });

  it('CreativeWork JSON.stringifies and parses back to a plain-data shape', () => {
    const universeId = generateUniverseId();
    const work = createCreativeWork({ universeId, title: 'Embers of Tomorrow', format: 'novel' });
    const parsed = JSON.parse(JSON.stringify(work));
    expect(parsed).toEqual({
      id: work.id,
      universeId: work.universeId,
      title: work.title,
      format: work.format,
      createdAt: work.createdAt,
    });
  });

  it('EntityRef JSON.stringifies and parses back to a plain-data shape', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const character = createCharacter({ scope, name: 'Ada Northwind' });
    const ref = createEntityRef({ universeId, entityId: character.id, kind: 'character' });
    const parsed = JSON.parse(JSON.stringify(ref));
    expect(parsed).toEqual({ universeId, entityId: character.id, kind: 'character' });
  });

  it('Character JSON.stringifies and parses back to a plain-data shape', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const character = createCharacter({ scope, name: 'Ada Northwind', aliases: ['Doc'] });
    const parsed = JSON.parse(JSON.stringify(character));
    expect(parsed).toEqual({
      id: character.id,
      kind: 'character',
      scope: { kind: 'universe', universeId },
      lifecycle: 'draft',
      name: 'Ada Northwind',
      aliases: ['Doc'],
    });
  });

  it('Location JSON.stringifies and parses back to a plain-data shape', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const location = createLocation({ scope, name: 'The Archive', description: 'A quiet place.' });
    const parsed = JSON.parse(JSON.stringify(location));
    expect(parsed).toEqual({
      id: location.id,
      kind: 'location',
      scope: { kind: 'universe', universeId },
      lifecycle: 'draft',
      name: 'The Archive',
      description: 'A quiet place.',
    });
  });

  it('CreativeEvent (with a temporal reference) JSON.stringifies and parses back to a plain-data shape', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const event = createCreativeEvent({
      scope,
      title: 'The Founding',
      temporalReference: { kind: 'textual', value: 'the first age' },
    });
    const parsed = JSON.parse(JSON.stringify(event));
    expect(parsed).toEqual({
      id: event.id,
      kind: 'event',
      scope: { kind: 'universe', universeId },
      lifecycle: 'draft',
      title: 'The Founding',
      temporalReference: { kind: 'textual', value: 'the first age' },
    });
  });
});
