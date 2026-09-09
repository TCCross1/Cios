import { describe, expect, it } from 'vitest';
import {
  createCharacter,
  createEntityScope,
  generateUniverseId,
  DomainValidationError,
} from '../src/index.js';

const scope = createEntityScope({ kind: 'universe', universeId: generateUniverseId() });

describe('Character', () => {
  it('constructs a valid character', () => {
    const character = createCharacter({ scope, name: 'Ada Northwind' });
    expect(character.name).toBe('Ada Northwind');
    expect(character.kind).toBe('character');
    expect(character.aliases).toEqual([]);
    expect(character.lifecycle).toBe('draft');
  });

  it('rejects an empty name', () => {
    expect(() => createCharacter({ scope, name: '' })).toThrow(DomainValidationError);
  });

  it('rejects a whitespace-only name', () => {
    expect(() => createCharacter({ scope, name: '   ' })).toThrow(DomainValidationError);
  });

  it('accepts aliases', () => {
    const character = createCharacter({
      scope,
      name: 'Ada Northwind',
      aliases: ['Doc', 'The Cartographer'],
    });
    expect(character.aliases).toEqual(['Doc', 'The Cartographer']);
  });

  it('normalizes aliases: trims, de-duplicates, preserves order and case', () => {
    const character = createCharacter({
      scope,
      name: 'Ada Northwind',
      aliases: ['  Doc ', 'Doc', 'DOC', 'The Cartographer'],
    });
    expect(character.aliases).toEqual(['Doc', 'DOC', 'The Cartographer']);
  });

  it('rejects an empty-after-trim alias', () => {
    expect(() => createCharacter({ scope, name: 'Ada Northwind', aliases: ['  '] })).toThrow(
      DomainValidationError,
    );
  });

  it('produces JSON-safe aliases', () => {
    const character = createCharacter({ scope, name: 'Ada Northwind', aliases: ['Doc'] });
    const roundTripped = JSON.parse(JSON.stringify(character));
    expect(roundTripped.aliases).toEqual(['Doc']);
  });
});
