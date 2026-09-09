import { describe, expect, it } from 'vitest';
import {
  createCreativeUniverse,
  isUniverseId,
  DomainValidationError,
  type UniverseId,
  type UtcTimestamp,
} from '../src/index.js';

describe('CreativeUniverse', () => {
  it('constructs a valid universe with generated id/createdAt', () => {
    const universe = createCreativeUniverse({ name: 'The Emberlands' });
    expect(universe.name).toBe('The Emberlands');
    expect(isUniverseId(universe.id)).toBe(true);
    expect(universe.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('rejects an empty name', () => {
    expect(() => createCreativeUniverse({ name: '' })).toThrow(DomainValidationError);
  });

  it('rejects a whitespace-only name', () => {
    expect(() => createCreativeUniverse({ name: '   \t  ' })).toThrow(DomainValidationError);
  });

  it('rejects an invalid id where runtime validation applies', () => {
    expect(() =>
      createCreativeUniverse({ name: 'Valid Name', id: 'not-an-id' as UniverseId }),
    ).toThrow(DomainValidationError);
  });

  it('rejects an invalid createdAt timestamp', () => {
    expect(() => createCreativeUniverse({ name: 'Valid Name', createdAt: 'yesterday' })).toThrow(
      DomainValidationError,
    );
  });

  it('accepts a pre-branded createdAt timestamp without re-validating', () => {
    const createdAt = '2025-06-01T12:00:00.000Z' as UtcTimestamp;
    const universe = createCreativeUniverse({ name: 'Valid Name', createdAt });
    expect(universe.createdAt).toBe(createdAt);
  });

  it('JSON-serializes a representative value safely', () => {
    const universe = createCreativeUniverse({
      name: 'The Emberlands',
      description: 'A world of dying stars and ember-forged pacts.',
    });
    const roundTripped = JSON.parse(JSON.stringify(universe));
    expect(roundTripped).toEqual({
      id: universe.id,
      name: universe.name,
      description: universe.description,
      createdAt: universe.createdAt,
    });
  });
});
