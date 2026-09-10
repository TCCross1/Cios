import { describe, expect, it } from 'vitest';
import {
  createCreativeObject,
  createEntityScope,
  generateUniverseId,
  DomainValidationError,
} from '../src/index.js';

const scope = createEntityScope({ kind: 'universe', universeId: generateUniverseId() });

describe('CreativeObject', () => {
  it('constructs a valid object with the required EntityKind "object"', () => {
    const object = createCreativeObject({ scope, name: 'The Signal Lantern' });
    expect(object.name).toBe('The Signal Lantern');
    expect(object.entityKind).toBe('object');
    expect(object.displayName).toBe('The Signal Lantern');
  });

  it('rejects the obsolete unauthorized "creative-object" EntityKind literal', () => {
    const object = createCreativeObject({ scope, name: 'The Signal Lantern' });
    expect(object.entityKind).not.toBe('creative-object');
  });

  it('rejects an empty required name', () => {
    expect(() => createCreativeObject({ scope, name: '' })).toThrow(DomainValidationError);
  });

  it('rejects a whitespace-only required name', () => {
    expect(() => createCreativeObject({ scope, name: '  \t' })).toThrow(DomainValidationError);
  });

  it('is frozen at runtime: direct mutation does not change the constructed value', () => {
    const object = createCreativeObject({ scope, name: 'The Signal Lantern' });
    expect(Object.isFrozen(object)).toBe(true);
    expect(() => {
      // @ts-expect-error CreativeObject.name is readonly at compile time too
      object.name = 'Mutated';
    }).toThrow(TypeError);
    expect(object.name).toBe('The Signal Lantern');
  });
});
