import { describe, expect, it } from 'vitest';
import {
  createCreativeWork,
  generateUniverseId,
  DomainValidationError,
  type UniverseId,
} from '../src/index.js';

describe('CreativeWork', () => {
  it('constructs a valid work', () => {
    const universeId = generateUniverseId();
    const work = createCreativeWork({ universeId, title: 'Embers of Tomorrow', format: 'novel' });
    expect(work.universeId).toBe(universeId);
    expect(work.title).toBe('Embers of Tomorrow');
    expect(work.format).toBe('novel');
  });

  it('requires a UniverseId at compile time', () => {
    expect(() => {
      // @ts-expect-error universeId is a required CreateCreativeWorkInput field
      createCreativeWork({ title: 'Missing Universe', format: 'novel' });
    }).toThrow(DomainValidationError);
  });

  it('rejects a malformed universeId at the runtime boundary', () => {
    expect(() =>
      createCreativeWork({
        universeId: 'not-a-universe-id' as UniverseId,
        title: 'Valid Title',
        format: 'novel',
      }),
    ).toThrow(DomainValidationError);
  });

  it('rejects an empty title', () => {
    const universeId = generateUniverseId();
    expect(() => createCreativeWork({ universeId, title: '', format: 'novel' })).toThrow(
      DomainValidationError,
    );
  });

  it('rejects a whitespace-only title', () => {
    const universeId = generateUniverseId();
    expect(() => createCreativeWork({ universeId, title: '  \n ', format: 'novel' })).toThrow(
      DomainValidationError,
    );
  });

  it('accepts every valid CreativeFormat', () => {
    const universeId = generateUniverseId();
    const formats = [
      'novel',
      'feature-film',
      'television',
      'sitcom',
      'animation',
      'narrative-game',
      'rpg',
      'graphic-narrative',
    ] as const;
    for (const format of formats) {
      const work = createCreativeWork({ universeId, title: 'Sample', format });
      expect(work.format).toBe(format);
    }
  });

  it('rejects an invalid format at the runtime boundary', () => {
    const universeId = generateUniverseId();
    expect(() =>
      createCreativeWork({
        universeId,
        title: 'Sample',
        // @ts-expect-error intentionally invalid format for a runtime-rejection test
        format: 'interpretive-dance',
      }),
    ).toThrow(DomainValidationError);
  });

  it('rejects an invalid createdAt timestamp', () => {
    const universeId = generateUniverseId();
    expect(() =>
      createCreativeWork({ universeId, title: 'Sample', format: 'novel', createdAt: 'soon' }),
    ).toThrow(DomainValidationError);
  });
});
