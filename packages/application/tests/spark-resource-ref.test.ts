import { describe, expect, it } from 'vitest';
import {
  createSparkResourceRef,
  isSparkResourceRef,
} from '../src/spark/source/spark-resource-ref.js';
import { createSparkSource } from '../src/spark/source/spark-source.js';
import { DomainValidationError } from '@cios/domain';

describe('SparkResourceRef', () => {
  it('accepts a valid opaque reference', () => {
    const ref = createSparkResourceRef('asset_01_future-object-reference');
    expect(ref).toBe('asset_01_future-object-reference');
  });

  it('normalizes surrounding technical whitespace (not creative content)', () => {
    const ref = createSparkResourceRef('  capture-resource-17  ');
    expect(ref).toBe('capture-resource-17');
  });

  it('rejects an empty reference', () => {
    expect(() => createSparkResourceRef('')).toThrow(DomainValidationError);
  });

  it('rejects a whitespace-only reference', () => {
    expect(() => createSparkResourceRef('   ')).toThrow(DomainValidationError);
  });

  it('serializes as a plain JSON-safe string', () => {
    const ref = createSparkResourceRef('future-object-reference');
    const roundTripped = JSON.parse(JSON.stringify({ ref }));
    expect(roundTripped).toEqual({ ref: 'future-object-reference' });
  });

  it('isSparkResourceRef is a true runtime guard', () => {
    expect(isSparkResourceRef('valid-ref')).toBe(true);
    expect(isSparkResourceRef('')).toBe(false);
    expect(isSparkResourceRef('   ')).toBe(false);
    expect(isSparkResourceRef(null)).toBe(false);
  });

  describe('voice/image/file source construction with valid refs', () => {
    it('constructs a VoiceSparkSource', () => {
      const source = createSparkSource({ modality: 'voice', resourceRef: 'capture-resource-17' });
      expect(source).toEqual({ modality: 'voice', resourceRef: 'capture-resource-17' });
    });

    it('constructs an ImageSparkSource', () => {
      const source = createSparkSource({ modality: 'image', resourceRef: 'asset_01' });
      expect(source).toEqual({ modality: 'image', resourceRef: 'asset_01' });
    });

    it('constructs a FileSparkSource', () => {
      const source = createSparkSource({ modality: 'file', resourceRef: 'future-file-reference' });
      expect(source).toEqual({ modality: 'file', resourceRef: 'future-file-reference' });
    });
  });
});
