import { describe, expect, it } from 'vitest';
import { createSparkSource, type SparkSource } from '../src/spark/source/spark-source.js';

describe('SparkSource: compile-time type safety', () => {
  it('narrows to TextSparkSource.content only when modality is "text"', () => {
    const source: SparkSource = createSparkSource({ modality: 'text', content: 'hello' });
    if (source.modality === 'text') {
      expect(source.content).toBe('hello');
      // @ts-expect-error a text-modality source has no resourceRef
      const resourceRef = source.resourceRef;
      expect(resourceRef).toBeUndefined();
    } else {
      throw new Error('expected text modality');
    }
  });

  it('narrows to a resourceRef-bearing source only for voice/image/file', () => {
    const source: SparkSource = createSparkSource({
      modality: 'image',
      resourceRef: 'asset-1',
    });
    if (source.modality === 'image') {
      expect(source.resourceRef).toBe('asset-1');
      // @ts-expect-error an image-modality source has no url
      const url = source.url;
      expect(url).toBeUndefined();
    } else {
      throw new Error('expected image modality');
    }
  });

  it('narrows to LinkSparkSource.url only when modality is "link"', () => {
    const source: SparkSource = createSparkSource({ modality: 'link', url: 'https://example.com' });
    if (source.modality === 'link') {
      expect(source.url).toBe('https://example.com');
      // @ts-expect-error a link-modality source has no content
      const content = source.content;
      expect(content).toBeUndefined();
    } else {
      throw new Error('expected link modality');
    }
  });

  it('rejects a text-shaped input claiming a non-text modality at compile time', () => {
    expect(() =>
      createSparkSource({
        modality: 'voice',
        // @ts-expect-error "voice" modality does not accept a `content` field
        content: 'not allowed for voice',
      }),
    ).toThrow();
  });

  it('rejects a link-shaped input claiming the "file" modality at compile time', () => {
    expect(() =>
      createSparkSource({
        modality: 'file',
        // @ts-expect-error "file" modality requires `resourceRef`, not `url`
        url: 'https://example.com',
      }),
    ).toThrow();
  });
});
