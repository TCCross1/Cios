import { describe, expect, it } from 'vitest';
import {
  createCreativeUniverse,
  isUniverseId,
  isLifecycleState,
  DomainValidationError,
  type UniverseId,
  type UtcTimestamp,
} from '../src/index.js';

describe('CreativeUniverse', () => {
  it('constructs a valid universe with generated id/createdAt/updatedAt/lifecycleState', () => {
    const universe = createCreativeUniverse({ name: 'The Emberlands' });
    expect(universe.name).toBe('The Emberlands');
    expect(isUniverseId(universe.id)).toBe(true);
    expect(universe.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(universe.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(isLifecycleState(universe.lifecycleState)).toBe(true);
  });

  it('defaults updatedAt to createdAt when omitted', () => {
    const universe = createCreativeUniverse({ name: 'The Emberlands' });
    expect(universe.updatedAt).toBe(universe.createdAt);
  });

  it('accepts a custom updatedAt when it is at or after createdAt', () => {
    const createdAt = '2025-06-01T12:00:00.000Z';
    const updatedAt = '2025-06-02T00:00:00.000Z';
    const universe = createCreativeUniverse({ name: 'Valid Name', createdAt, updatedAt });
    expect(universe.createdAt).toBe(createdAt);
    expect(universe.updatedAt).toBe(updatedAt);
  });

  it('accepts an updatedAt equal to createdAt', () => {
    const timestamp = '2025-06-01T12:00:00.000Z';
    const universe = createCreativeUniverse({
      name: 'Valid Name',
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    expect(universe.updatedAt).toBe(universe.createdAt);
  });

  it('rejects an updatedAt earlier than createdAt', () => {
    expect(() =>
      createCreativeUniverse({
        name: 'Valid Name',
        createdAt: '2025-06-02T00:00:00.000Z',
        updatedAt: '2025-06-01T00:00:00.000Z',
      }),
    ).toThrow(DomainValidationError);
  });

  it('defaults lifecycleState to "draft" when omitted', () => {
    const universe = createCreativeUniverse({ name: 'The Emberlands' });
    expect(universe.lifecycleState).toBe('draft');
  });

  it('accepts a supplied valid lifecycleState', () => {
    const universe = createCreativeUniverse({ name: 'The Emberlands', lifecycleState: 'active' });
    expect(universe.lifecycleState).toBe('active');
  });

  it('rejects an unsupported lifecycleState', () => {
    expect(() =>
      createCreativeUniverse({
        name: 'The Emberlands',
        // @ts-expect-error intentionally invalid lifecycleState for a runtime-rejection test
        lifecycleState: 'canon',
      }),
    ).toThrow(DomainValidationError);
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

  it('rejects an invalid updatedAt timestamp', () => {
    expect(() => createCreativeUniverse({ name: 'Valid Name', updatedAt: 'soon' })).toThrow(
      DomainValidationError,
    );
  });

  it('rejects a calendar-impossible createdAt through the full construction path (Directive 003R2)', () => {
    expect(() =>
      createCreativeUniverse({ name: 'Valid Name', createdAt: '2026-02-30T12:00:00.000Z' }),
    ).toThrow(DomainValidationError);
  });

  it('rejects a calendar-impossible updatedAt through the full construction path (Directive 003R2)', () => {
    expect(() =>
      createCreativeUniverse({
        name: 'Valid Name',
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-02-30T12:00:00.000Z',
      }),
    ).toThrow(DomainValidationError);
  });

  it('accepts a pre-branded createdAt timestamp (it is still re-validated, not bypassed)', () => {
    const createdAt = '2025-06-01T12:00:00.000Z' as UtcTimestamp;
    const universe = createCreativeUniverse({ name: 'Valid Name', createdAt });
    expect(universe.createdAt).toBe(createdAt);
  });

  it('is frozen at runtime: direct mutation does not change the constructed value', () => {
    const universe = createCreativeUniverse({ name: 'The Emberlands' });
    expect(Object.isFrozen(universe)).toBe(true);
    expect(() => {
      // @ts-expect-error CreativeUniverse.name is readonly at compile time too
      universe.name = 'Mutated';
    }).toThrow(TypeError);
    expect(universe.name).toBe('The Emberlands');
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
      updatedAt: universe.updatedAt,
      lifecycleState: universe.lifecycleState,
    });
  });
});
