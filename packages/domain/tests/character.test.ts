import { describe, expect, it } from 'vitest';
import {
  createCharacter,
  createEntityScope,
  generateUniverseId,
  DomainValidationError,
} from '../src/index.js';

const universeId = generateUniverseId();
const scope = createEntityScope({ kind: 'universe', universeId });

describe('Character', () => {
  it('constructs a valid character', () => {
    const character = createCharacter({ scope, name: 'Ada Northwind' });
    expect(character.name).toBe('Ada Northwind');
    expect(character.entityKind).toBe('character');
    expect(character.aliases).toEqual([]);
    expect(character.lifecycleState).toBe('draft');
  });

  it('exposes the shared entity foundation fields', () => {
    const character = createCharacter({ scope, name: 'Ada Northwind' });
    expect(character.universeId).toBe(universeId);
    expect(character.scope).toEqual(scope);
    expect(character.scope.universeId).toBe(character.universeId);
    expect(character.displayName).toBe('Ada Northwind');
    expect(character.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(character.updatedAt).toBe(character.createdAt);
  });

  it('always derives displayName from name — the two can never diverge', () => {
    const character = createCharacter({ scope, name: 'The Cartographer' });
    expect(character.displayName).toBe(character.name);
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

  it('is frozen at runtime: direct mutation does not change the constructed value', () => {
    const character = createCharacter({ scope, name: 'Ada Northwind' });
    expect(Object.isFrozen(character)).toBe(true);
    expect(() => {
      // @ts-expect-error Character.name is readonly at compile time too
      character.name = 'Mutated';
    }).toThrow(TypeError);
    expect(character.name).toBe('Ada Northwind');
  });

  it('freezes the aliases array: aliases.push cannot modify it', () => {
    const character = createCharacter({ scope, name: 'Ada Northwind', aliases: ['Doc'] });
    expect(Object.isFrozen(character.aliases)).toBe(true);
    expect(() => {
      (character.aliases as string[]).push('Intruder');
    }).toThrow(TypeError);
    expect(character.aliases).toEqual(['Doc']);
  });

  it('is unaffected by the caller mutating the original aliases array after construction', () => {
    const aliases = ['A'];
    const character = createCharacter({ scope, name: 'Ada Northwind', aliases });
    aliases.push('B');
    expect(character.aliases).toEqual(['A']);
  });

  it('freezes scope.universeId against post-construction mutation', () => {
    const character = createCharacter({ scope, name: 'Ada Northwind' });
    expect(Object.isFrozen(character.scope)).toBe(true);
    expect(() => {
      // @ts-expect-error EntityScope.universeId is readonly at compile time too
      character.scope.universeId = 'evil';
    }).toThrow(TypeError);
    expect(character.scope.universeId).toBe(universeId);
  });
});
