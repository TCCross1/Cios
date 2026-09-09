import { describe, expect, it } from 'vitest';
import { createTemporalReference, DomainValidationError } from '../src/index.js';

describe('TemporalReference', () => {
  it('accepts a valid exact UTC timestamp variant', () => {
    const ref = createTemporalReference({ kind: 'exact', timestamp: '2026-01-01T00:00:00.000Z' });
    expect(ref).toEqual({ kind: 'exact', timestamp: '2026-01-01T00:00:00.000Z' });
  });

  it('rejects a malformed exact timestamp', () => {
    expect(() => createTemporalReference({ kind: 'exact', timestamp: 'not-a-date' })).toThrow(
      DomainValidationError,
    );
    expect(() => createTemporalReference({ kind: 'exact', timestamp: '2026-01-01' })).toThrow(
      DomainValidationError,
    );
  });

  it('accepts a valid textual/fictional date variant', () => {
    const ref = createTemporalReference({
      kind: 'textual',
      value: 'the third year of the Long Winter',
    });
    expect(ref).toEqual({ kind: 'textual', value: 'the third year of the Long Winter' });
  });

  it('rejects an empty textual value', () => {
    expect(() => createTemporalReference({ kind: 'textual', value: '   ' })).toThrow(
      DomainValidationError,
    );
  });

  it('accepts a valid relative label variant', () => {
    const ref = createTemporalReference({
      kind: 'relative',
      label: 'three days after the coronation',
    });
    expect(ref).toEqual({ kind: 'relative', label: 'three days after the coronation' });
  });

  it('rejects an empty relative label', () => {
    expect(() => createTemporalReference({ kind: 'relative', label: '' })).toThrow(
      DomainValidationError,
    );
  });

  it('accepts the unknown variant', () => {
    const ref = createTemporalReference({ kind: 'unknown' });
    expect(ref).toEqual({ kind: 'unknown' });
  });

  it('rejects an invalid discriminant', () => {
    expect(() =>
      createTemporalReference({
        // @ts-expect-error intentionally invalid discriminant for a runtime-rejection test
        kind: 'era',
      }),
    ).toThrow(DomainValidationError);
  });
});
