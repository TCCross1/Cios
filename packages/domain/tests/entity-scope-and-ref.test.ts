import { describe, expect, it } from 'vitest';
import {
  createEntityScope,
  createEntityRef,
  isEntityKind,
  generateUniverseId,
  generateWorkId,
  generateEntityId,
  DomainValidationError,
  type UniverseId,
  type WorkId,
  type EntityId,
} from '../src/index.js';

describe('EntityScope', () => {
  it('accepts a valid universe scope', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    expect(scope).toEqual({ kind: 'universe', universeId });
  });

  it('accepts a valid work scope', () => {
    const universeId = generateUniverseId();
    const workId = generateWorkId();
    const scope = createEntityScope({ kind: 'work', universeId, workId });
    expect(scope).toEqual({ kind: 'work', universeId, workId });
  });

  it('rejects a work scope missing a valid WorkId', () => {
    const universeId = generateUniverseId();
    expect(() =>
      createEntityScope({ kind: 'work', universeId, workId: 'not-a-work-id' as WorkId }),
    ).toThrow(DomainValidationError);
  });

  it('rejects a malformed universeId regardless of discriminant', () => {
    expect(() => createEntityScope({ kind: 'universe', universeId: 'nope' as UniverseId })).toThrow(
      DomainValidationError,
    );
  });

  it('rejects an invalid discriminant', () => {
    const universeId = generateUniverseId();
    expect(() =>
      createEntityScope({
        // @ts-expect-error intentionally invalid discriminant for a runtime-rejection test
        kind: 'galaxy',
        universeId,
      }),
    ).toThrow(DomainValidationError);
  });

  it('is frozen at runtime: cannot be mutated after creation', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    expect(Object.isFrozen(scope)).toBe(true);
    expect(() => {
      // @ts-expect-error EntityScope.universeId is readonly at compile time too
      scope.universeId = 'evil' as UniverseId;
    }).toThrow(TypeError);
    expect(scope.universeId).toBe(universeId);
  });
});

describe('EntityRef', () => {
  it('accepts a valid EntityRef', () => {
    const universeId = generateUniverseId();
    const entityId = generateEntityId();
    const ref = createEntityRef({ universeId, entityId, entityKind: 'character' });
    expect(ref).toEqual({ universeId, entityId, entityKind: 'character' });
  });

  it('requires a valid universeId', () => {
    const entityId = generateEntityId();
    expect(() =>
      createEntityRef({ universeId: 'bad' as UniverseId, entityId, entityKind: 'character' }),
    ).toThrow(DomainValidationError);
  });

  it('requires a valid entityId', () => {
    const universeId = generateUniverseId();
    expect(() =>
      createEntityRef({ universeId, entityId: 'bad' as EntityId, entityKind: 'character' }),
    ).toThrow(DomainValidationError);
  });

  it('rejects a missing entityKind', () => {
    const universeId = generateUniverseId();
    const entityId = generateEntityId();
    expect(() =>
      createEntityRef({
        universeId,
        entityId,
        // @ts-expect-error entityKind is required and must be a valid EntityKind
        entityKind: undefined,
      }),
    ).toThrow(DomainValidationError);
  });

  it('rejects an unrecognized entityKind', () => {
    const universeId = generateUniverseId();
    const entityId = generateEntityId();
    expect(() =>
      createEntityRef({
        universeId,
        entityId,
        // @ts-expect-error intentionally invalid entityKind for a runtime-rejection test
        entityKind: 'not-a-real-kind',
      }),
    ).toThrow(DomainValidationError);
  });

  it('accepts the required "object" EntityKind (not "creative-object")', () => {
    const universeId = generateUniverseId();
    const entityId = generateEntityId();
    const ref = createEntityRef({ universeId, entityId, entityKind: 'object' });
    expect(ref.entityKind).toBe('object');
  });

  it('rejects the obsolete unauthorized "creative-object" EntityKind literal', () => {
    const universeId = generateUniverseId();
    const entityId = generateEntityId();
    expect(() =>
      createEntityRef({
        universeId,
        entityId,
        // @ts-expect-error "creative-object" is not a valid EntityKind; the required literal is "object"
        entityKind: 'creative-object',
      }),
    ).toThrow(DomainValidationError);
  });

  it('does not accept the obsolete "kind" field as part of the public contract', () => {
    const universeId = generateUniverseId();
    const entityId = generateEntityId();
    const ref = createEntityRef({ universeId, entityId, entityKind: 'character' });
    expect((ref as unknown as { kind?: unknown }).kind).toBeUndefined();
    expect(Object.keys(ref).sort()).toEqual(['entityId', 'entityKind', 'universeId']);
  });

  it('JSON-serializes to a stable plain-data shape using "entityKind"', () => {
    const universeId = generateUniverseId();
    const entityId = generateEntityId();
    const ref = createEntityRef({ universeId, entityId, entityKind: 'location' });

    const roundTripped = JSON.parse(JSON.stringify(ref));
    expect(roundTripped).toEqual({ universeId, entityId, entityKind: 'location' });
  });

  it('preserves cross-universe identity fields alongside entityKind', () => {
    const universeId = generateUniverseId();
    const entityId = generateEntityId();
    const ref = createEntityRef({ universeId, entityId, entityKind: 'faction' });
    expect(ref.universeId).toBe(universeId);
    expect(ref.entityId).toBe(entityId);
  });

  it('is frozen at runtime: cannot be mutated after creation', () => {
    const universeId = generateUniverseId();
    const entityId = generateEntityId();
    const ref = createEntityRef({ universeId, entityId, entityKind: 'character' });
    expect(Object.isFrozen(ref)).toBe(true);
    expect(() => {
      // @ts-expect-error EntityRef.entityKind is readonly at compile time too
      ref.entityKind = 'location';
    }).toThrow(TypeError);
    expect(ref.entityKind).toBe('character');
  });
});

describe('isEntityKind', () => {
  it('accepts every required kind, including the corrected "object"', () => {
    const kinds = [
      'character',
      'location',
      'object',
      'faction',
      'event',
      'concept',
      'theme',
      'rule',
    ];
    for (const kind of kinds) {
      expect(isEntityKind(kind)).toBe(true);
    }
  });

  it('rejects the obsolete unauthorized "creative-object" literal', () => {
    expect(isEntityKind('creative-object')).toBe(false);
  });

  it('rejects an unsupported kind', () => {
    expect(isEntityKind('spark')).toBe(false);
    expect(isEntityKind('canon-fact')).toBe(false);
  });
});
