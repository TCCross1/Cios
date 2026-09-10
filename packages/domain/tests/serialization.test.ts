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
      updatedAt: universe.updatedAt,
      lifecycleState: universe.lifecycleState,
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
      updatedAt: work.updatedAt,
      lifecycleState: work.lifecycleState,
    });
  });

  it('EntityRef JSON.stringifies and parses back to a plain-data shape', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const character = createCharacter({ scope, name: 'Ada Northwind' });
    const ref = createEntityRef({ universeId, entityId: character.entityId, kind: 'character' });
    const parsed = JSON.parse(JSON.stringify(ref));
    expect(parsed).toEqual({ universeId, entityId: character.entityId, kind: 'character' });
  });

  it('Character JSON.stringifies and parses back to a plain-data shape', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const character = createCharacter({ scope, name: 'Ada Northwind', aliases: ['Doc'] });
    const parsed = JSON.parse(JSON.stringify(character));
    expect(parsed).toEqual({
      entityId: character.entityId,
      universeId: character.universeId,
      entityKind: 'character',
      scope: { kind: 'universe', universeId },
      displayName: 'Ada Northwind',
      lifecycleState: 'draft',
      createdAt: character.createdAt,
      updatedAt: character.updatedAt,
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
      entityId: location.entityId,
      universeId: location.universeId,
      entityKind: 'location',
      scope: { kind: 'universe', universeId },
      displayName: 'The Archive',
      lifecycleState: 'draft',
      createdAt: location.createdAt,
      updatedAt: location.updatedAt,
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
      entityId: event.entityId,
      universeId: event.universeId,
      entityKind: 'event',
      scope: { kind: 'universe', universeId },
      displayName: 'The Founding',
      lifecycleState: 'draft',
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
      title: 'The Founding',
      temporalReference: { kind: 'textual', value: 'the first age' },
    });
  });

  it('Object.freeze does not interfere with JSON serialization', () => {
    const universe = createCreativeUniverse({ name: 'The Emberlands' });
    expect(Object.isFrozen(universe)).toBe(true);
    expect(() => JSON.stringify(universe)).not.toThrow();
  });
});
