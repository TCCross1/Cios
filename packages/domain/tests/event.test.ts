import { describe, expect, it } from 'vitest';
import {
  createCreativeEvent,
  createEntityScope,
  generateUniverseId,
  DomainValidationError,
} from '../src/index.js';

const scope = createEntityScope({ kind: 'universe', universeId: generateUniverseId() });

describe('CreativeEvent', () => {
  it('constructs a valid event without temporal information', () => {
    const event = createCreativeEvent({ scope, title: 'The Long Winter Begins' });
    expect(event.title).toBe('The Long Winter Begins');
    expect(event.temporalReference).toBeUndefined();
  });

  it('rejects an empty title', () => {
    expect(() => createCreativeEvent({ scope, title: '' })).toThrow(DomainValidationError);
  });

  it('accepts an exact temporal variant', () => {
    const event = createCreativeEvent({
      scope,
      title: 'The Signing of the Accord',
      temporalReference: { kind: 'exact', timestamp: '2026-01-01T00:00:00.000Z' },
    });
    expect(event.temporalReference).toEqual({
      kind: 'exact',
      timestamp: '2026-01-01T00:00:00.000Z',
    });
  });

  it('accepts a textual temporal variant', () => {
    const event = createCreativeEvent({
      scope,
      title: 'The Founding',
      temporalReference: { kind: 'textual', value: 'the first age' },
    });
    expect(event.temporalReference).toEqual({ kind: 'textual', value: 'the first age' });
  });

  it('accepts a relative temporal variant', () => {
    const event = createCreativeEvent({
      scope,
      title: 'The Betrayal',
      temporalReference: { kind: 'relative', label: 'the night before the coronation' },
    });
    expect(event.temporalReference).toEqual({
      kind: 'relative',
      label: 'the night before the coronation',
    });
  });

  it('accepts an unknown temporal variant', () => {
    const event = createCreativeEvent({
      scope,
      title: 'An Unrecorded Moment',
      temporalReference: { kind: 'unknown' },
    });
    expect(event.temporalReference).toEqual({ kind: 'unknown' });
  });

  it('rejects invalid temporal variant data', () => {
    expect(() =>
      createCreativeEvent({
        scope,
        title: 'A Malformed Event',
        temporalReference: { kind: 'exact', timestamp: 'not-a-real-timestamp' },
      }),
    ).toThrow(DomainValidationError);
  });
});
