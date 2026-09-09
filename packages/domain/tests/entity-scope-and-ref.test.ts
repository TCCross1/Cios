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
});

describe('EntityRef', () => {
  it('accepts a valid EntityRef', () => {
    const universeId = generateUniverseId();
    const entityId = generateEntityId();
    const ref = createEntityRef({ universeId, entityId, kind: 'character' });
    expect(ref).toEqual({ universeId, entityId, kind: 'character' });
  });

  it('requires a valid universeId', () => {
    const entityId = generateEntityId();
    expect(() =>
      createEntityRef({ universeId: 'bad' as UniverseId, entityId, kind: 'character' }),
    ).toThrow(DomainValidationError);
  });

  it('requires a valid entityId', () => {
    const universeId = generateUniverseId();
    expect(() =>
      createEntityRef({ universeId, entityId: 'bad' as EntityId, kind: 'character' }),
    ).toThrow(DomainValidationError);
  });

  it('rejects an unrecognized kind', () => {
    const universeId = generateUniverseId();
    const entityId = generateEntityId();
    expect(() =>
      createEntityRef({
        universeId,
        entityId,
        // @ts-expect-error intentionally invalid kind for a runtime-rejection test
        kind: 'not-a-real-kind',
      }),
    ).toThrow(DomainValidationError);
  });

  it('JSON-serializes to a stable plain-data shape', () => {
    const universeId = generateUniverseId();
    const entityId = generateEntityId();
    const ref = createEntityRef({ universeId, entityId, kind: 'location' });

    const roundTripped = JSON.parse(JSON.stringify(ref));
    expect(roundTripped).toEqual({ universeId, entityId, kind: 'location' });
  });
});

describe('isEntityKind', () => {
  it('accepts every supported kind', () => {
    const kinds = [
      'character',
      'location',
      'creative-object',
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

  it('rejects an unsupported kind', () => {
    expect(isEntityKind('spark')).toBe(false);
    expect(isEntityKind('canon-fact')).toBe(false);
  });
});
