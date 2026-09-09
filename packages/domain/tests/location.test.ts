import { describe, expect, it } from 'vitest';
import {
  createLocation,
  createEntityScope,
  generateUniverseId,
  generateEntityId,
  DomainValidationError,
  type EntityId,
} from '../src/index.js';

const scope = createEntityScope({ kind: 'universe', universeId: generateUniverseId() });

describe('Location', () => {
  it('constructs a valid location', () => {
    const location = createLocation({ scope, name: 'The Archive' });
    expect(location.name).toBe('The Archive');
    expect(location.kind).toBe('location');
  });

  it('rejects an empty name', () => {
    expect(() => createLocation({ scope, name: '' })).toThrow(DomainValidationError);
  });

  it('accepts an optional parent', () => {
    const parentId = generateEntityId();
    const location = createLocation({ scope, name: 'Reading Room', parentLocationId: parentId });
    expect(location.parentLocationId).toBe(parentId);
  });

  it('is valid without a parent', () => {
    const location = createLocation({ scope, name: 'The Archive' });
    expect(location.parentLocationId).toBeUndefined();
  });

  it('rejects a direct self-parent', () => {
    const id = generateEntityId();
    expect(() => createLocation({ id, scope, name: 'The Archive', parentLocationId: id })).toThrow(
      DomainValidationError,
    );
  });

  it('rejects a malformed parentLocationId', () => {
    expect(() =>
      createLocation({ scope, name: 'The Archive', parentLocationId: 'not-an-id' as EntityId }),
    ).toThrow(DomainValidationError);
  });
});
