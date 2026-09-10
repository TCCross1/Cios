import { describe, expect, it } from 'vitest';
import { createSparkSource } from '../src/spark/source/spark-source.js';
import { DomainValidationError } from '@cios/domain';

describe('TextSparkSource: exact preservation', () => {
  it('preserves leading/trailing whitespace and a trailing newline exactly', () => {
    const content = '  The moon remembers us.\n';
    const source = createSparkSource({ modality: 'text', content });
    expect(source).toEqual({ modality: 'text', content });
    if (source.modality === 'text') {
      expect(source.content).toBe(content);
    }
  });

  it('preserves multiple internal spaces and tabs', () => {
    const content = 'a\tb    c\td';
    const source = createSparkSource({ modality: 'text', content });
    if (source.modality === 'text') {
      expect(source.content).toBe(content);
    }
  });

  it('preserves multiple newlines / CRLF sequences', () => {
    const content = 'line one\r\nline two\n\nline four';
    const source = createSparkSource({ modality: 'text', content });
    if (source.modality === 'text') {
      expect(source.content).toBe(content);
    }
  });

  it('preserves curly quotes and unusual punctuation', () => {
    const content = '“Hello,” she said—then paused… why?!';
    const source = createSparkSource({ modality: 'text', content });
    if (source.modality === 'text') {
      expect(source.content).toBe(content);
    }
  });

  it('preserves emoji and non-ASCII text', () => {
    const content = '月が私たちを覚えている 🌙✨ café résumé';
    const source = createSparkSource({ modality: 'text', content });
    if (source.modality === 'text') {
      expect(source.content).toBe(content);
    }
  });

  it('rejects an empty string', () => {
    expect(() => createSparkSource({ modality: 'text', content: '' })).toThrow(
      DomainValidationError,
    );
  });

  it('rejects a whitespace-only string', () => {
    expect(() => createSparkSource({ modality: 'text', content: '   \n\t  ' })).toThrow(
      DomainValidationError,
    );
  });

  it('does not merely compare trimmed content: a value only valid after trimming is still stored raw', () => {
    const content = '   The moon remembers us.   ';
    const source = createSparkSource({ modality: 'text', content });
    if (source.modality === 'text') {
      // Exact, not trimmed.
      expect(source.content).toBe(content);
      expect(source.content).not.toBe(content.trim());
    }
  });
});
