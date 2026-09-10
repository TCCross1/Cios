import { describe, expect, it } from 'vitest';
import { createSparkSource } from '../src/spark/source/spark-source.js';
import { DomainValidationError } from '@cios/domain';

describe('LinkSparkSource: validation and exact raw preservation', () => {
  it.each(['https://example.com', 'http://example.com/path'])('accepts %s', (url) => {
    const source = createSparkSource({ modality: 'link', url });
    expect(source).toEqual({ modality: 'link', url });
  });

  it.each([
    'javascript:alert(1)',
    'data:text/plain,hello',
    'file:///tmp/test',
    'ftp://example.com',
    'mailto:test@example.com',
    'example.com',
    'not a url',
    '',
  ])('rejects %s', (url) => {
    expect(() => createSparkSource({ modality: 'link', url })).toThrow(DomainValidationError);
  });

  it('validates a trimmed view while retaining the exact original raw string', () => {
    const url = '  https://example.com/inspiration  ';
    const source = createSparkSource({ modality: 'link', url });
    expect(source.modality).toBe('link');
    if (source.modality === 'link') {
      expect(source.url).toBe(url);
      expect(source.url).not.toBe(url.trim());
    }
  });

  it('never stores a URL-object-normalized value', () => {
    const url = 'https://example.com';
    const source = createSparkSource({ modality: 'link', url });
    if (source.modality === 'link') {
      expect(source.url).toBe(url);
      // new URL('https://example.com').toString() === 'https://example.com/'
      // (adds a trailing slash) — Spark must retain the un-normalized form.
      expect(source.url).not.toBe(new URL(url).toString());
    }
  });
});
