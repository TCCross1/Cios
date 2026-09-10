import { describe, expect, it } from 'vitest';
import {
  createUtcTimestamp,
  isUtcTimestamp,
  nowAsUtcTimestamp,
  DomainValidationError,
} from '../src/index.js';

describe('UtcTimestamp: calendar-validity (Directive 003R2)', () => {
  describe('valid calendar cases', () => {
    it.each([
      '2024-02-29T12:00:00.000Z', // leap-year leap day
      '2026-12-31T23:59:59.999Z', // year-end boundary
      '2026-01-01T00:00:00.000Z', // year-start boundary
      '2026-02-28T23:59:59.999Z', // last day of a non-leap February
    ])('accepts %s', (value) => {
      expect(isUtcTimestamp(value)).toBe(true);
      expect(createUtcTimestamp(value)).toBe(value);
    });
  });

  describe('invalid calendar cases', () => {
    it.each([
      '2026-02-30T12:00:00.000Z', // February never has a 30th
      '2025-02-29T12:00:00.000Z', // 2025 is not a leap year
      '2026-13-01T00:00:00.000Z', // month 13 does not exist
      '2026-00-01T00:00:00.000Z', // month 00 does not exist
      '2026-01-32T00:00:00.000Z', // day 32 does not exist
      '2026-01-00T00:00:00.000Z', // day 00 does not exist
      '2026-01-01T24:01:00.000Z', // hour 24 is out of range
      '2026-01-01T23:60:00.000Z', // minute 60 is out of range
      '2026-01-01T23:59:60.000Z', // second 60 is out of range
    ])('rejects %s (this exact value was previously silently accepted/normalized)', (value) => {
      expect(isUtcTimestamp(value)).toBe(false);
      expect(() => createUtcTimestamp(value)).toThrow(DomainValidationError);
    });
  });

  describe('malformed syntax (pre-existing coverage, preserved)', () => {
    it.each([
      '2026-01-01',
      '2026-01-01 00:00:00.000Z',
      '2026-01-01T00:00:00Z',
      '2026-01-01T00:00:00.000',
      'not-a-timestamp',
      '',
    ])('rejects %s', (value) => {
      expect(isUtcTimestamp(value)).toBe(false);
      expect(() => createUtcTimestamp(value)).toThrow(DomainValidationError);
    });
  });

  it('produces a valid, calendar-correct current instant', () => {
    const now = nowAsUtcTimestamp();
    expect(isUtcTimestamp(now)).toBe(true);
  });
});
