import { describe, expect, it } from 'vitest';
import {
  createCreativeWork,
  generateUniverseId,
  isLifecycleState,
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

  it('constructs a work with createdAt/updatedAt/lifecycleState', () => {
    const universeId = generateUniverseId();
    const work = createCreativeWork({ universeId, title: 'Embers of Tomorrow', format: 'novel' });
    expect(work.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(work.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(isLifecycleState(work.lifecycleState)).toBe(true);
  });

  it('defaults updatedAt to createdAt when omitted', () => {
    const universeId = generateUniverseId();
    const work = createCreativeWork({ universeId, title: 'Sample', format: 'novel' });
    expect(work.updatedAt).toBe(work.createdAt);
  });

  it('accepts a custom updatedAt at or after createdAt', () => {
    const universeId = generateUniverseId();
    const createdAt = '2025-06-01T12:00:00.000Z';
    const updatedAt = '2025-06-01T12:00:00.000Z';
    const work = createCreativeWork({
      universeId,
      title: 'Sample',
      format: 'novel',
      createdAt,
      updatedAt,
    });
    expect(work.createdAt).toBe(createdAt);
    expect(work.updatedAt).toBe(updatedAt);
  });

  it('rejects an updatedAt earlier than createdAt', () => {
    const universeId = generateUniverseId();
    expect(() =>
      createCreativeWork({
        universeId,
        title: 'Sample',
        format: 'novel',
        createdAt: '2025-06-02T00:00:00.000Z',
        updatedAt: '2025-06-01T00:00:00.000Z',
      }),
    ).toThrow(DomainValidationError);
  });

  it('defaults lifecycleState to "draft" when omitted', () => {
    const universeId = generateUniverseId();
    const work = createCreativeWork({ universeId, title: 'Sample', format: 'novel' });
    expect(work.lifecycleState).toBe('draft');
  });

  it('rejects an unsupported lifecycleState', () => {
    const universeId = generateUniverseId();
    expect(() =>
      createCreativeWork({
        universeId,
        title: 'Sample',
        format: 'novel',
        // @ts-expect-error intentionally invalid lifecycleState for a runtime-rejection test
        lifecycleState: 'canon',
      }),
    ).toThrow(DomainValidationError);
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

  it('accepts every required CreativeFormat value', () => {
    const universeId = generateUniverseId();
    const formats = [
      'novel',
      'feature-film',
      'television-series',
      'sitcom',
      'animation',
      'narrative-game',
      'role-playing-game',
      'graphic-narrative',
      'audio',
      'interactive',
      'other',
    ] as const;
    for (const format of formats) {
      const work = createCreativeWork({ universeId, title: 'Sample', format });
      expect(work.format).toBe(format);
    }
  });

  it('rejects the obsolete unauthorized "television" literal', () => {
    const universeId = generateUniverseId();
    expect(() =>
      createCreativeWork({
        universeId,
        title: 'Sample',
        // @ts-expect-error "television" was renamed to "television-series" and is no longer valid
        format: 'television',
      }),
    ).toThrow(DomainValidationError);
  });

  it('rejects the obsolete unauthorized "rpg" literal', () => {
    const universeId = generateUniverseId();
    expect(() =>
      createCreativeWork({
        universeId,
        title: 'Sample',
        // @ts-expect-error "rpg" was renamed to "role-playing-game" and is no longer valid
        format: 'rpg',
      }),
    ).toThrow(DomainValidationError);
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

  it('is frozen at runtime: direct mutation does not change the constructed value', () => {
    const universeId = generateUniverseId();
    const work = createCreativeWork({ universeId, title: 'Sample', format: 'novel' });
    expect(Object.isFrozen(work)).toBe(true);
    expect(() => {
      // @ts-expect-error CreativeWork.title is readonly at compile time too
      work.title = 'Mutated';
    }).toThrow(TypeError);
    expect(work.title).toBe('Sample');
  });
});
