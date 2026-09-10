import { describe, expect, it } from 'vitest';
import {
  createSparkModality,
  isSparkModality,
} from '../src/spark/source/spark-modality.js';
import { DomainValidationError } from '@cios/domain';

describe('SparkModality', () => {
  it.each(['text', 'voice', 'image', 'link', 'file'])('accepts "%s"', (modality) => {
    expect(isSparkModality(modality)).toBe(true);
    expect(createSparkModality(modality)).toBe(modality);
  });

  it.each(['mixed', 'ai', 'other', 'generated', ''])('rejects "%s"', (modality) => {
    expect(isSparkModality(modality)).toBe(false);
    expect(() => createSparkModality(modality)).toThrow(DomainValidationError);
  });

  it('rejects non-string values', () => {
    expect(isSparkModality(undefined)).toBe(false);
    expect(isSparkModality(null)).toBe(false);
    expect(isSparkModality(42)).toBe(false);
  });
});
