import { describe, expect, it } from 'vitest';
import {
  createCreativeObject,
  createEntityScope,
  generateUniverseId,
  DomainValidationError,
} from '../src/index.js';

const scope = createEntityScope({ kind: 'universe', universeId: generateUniverseId() });

describe('CreativeObject', () => {
  it('constructs a valid object', () => {
    const object = createCreativeObject({ scope, name: 'The Signal Lantern' });
    expect(object.name).toBe('The Signal Lantern');
    expect(object.kind).toBe('creative-object');
  });

  it('rejects an empty required name', () => {
    expect(() => createCreativeObject({ scope, name: '' })).toThrow(DomainValidationError);
  });

  it('rejects a whitespace-only required name', () => {
    expect(() => createCreativeObject({ scope, name: '  \t' })).toThrow(DomainValidationError);
  });
});
