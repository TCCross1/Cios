import { describe, expect, it } from 'vitest';
import { isProvenanceType, createProvenanceType } from '../src/index.js';
import { DomainValidationError } from '@cios/domain';

describe('ProvenanceType', () => {
  it.each([
    'creator-original',
    'ai-interpretation',
    'ai-suggestion',
    'ai-expansion',
    'ai-revision',
    'hybrid',
    'imported-reference',
  ])('accepts the exact canonical value %s', (value) => {
    expect(isProvenanceType(value)).toBe(true);
    expect(createProvenanceType(value)).toBe(value);
  });

  it.each(['creator', 'ai', 'interpretation', 'revision', 'imported', 'canon', 'approved'])(
    'rejects the non-canonical synonym/abbreviation %s',
    (value) => {
      expect(isProvenanceType(value)).toBe(false);
      expect(() => createProvenanceType(value)).toThrow(DomainValidationError);
    },
  );

  it('rejects case-variant and empty values', () => {
    expect(isProvenanceType('Creator-Original')).toBe(false);
    expect(isProvenanceType('')).toBe(false);
    expect(isProvenanceType('CREATOR-ORIGINAL')).toBe(false);
  });
});
