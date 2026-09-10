import { describe, expect, it } from 'vitest';
import { createExternalSourceRef } from '../src/index.js';
import { DomainValidationError } from '@cios/domain';

describe('ExternalSourceRef', () => {
  it('accepts a valid url source', () => {
    const source = createExternalSourceRef({
      sourceKind: 'url',
      locator: 'https://example.com/reference-article',
    });
    expect(source.sourceKind).toBe('url');
    expect(source.locator).toBe('https://example.com/reference-article');
  });

  it('rejects a malformed url source', () => {
    expect(() => createExternalSourceRef({ sourceKind: 'url', locator: 'not a url' })).toThrow(
      DomainValidationError,
    );
  });

  describe('http/https acceptance (Directive 004R)', () => {
    it.each([
      'https://example.com',
      'http://example.com/path',
      'https://example.com/path?x=1#section',
      'https://sub.example.com/resource',
    ])('accepts %s', (locator) => {
      const source = createExternalSourceRef({ sourceKind: 'url', locator });
      expect(source.sourceKind).toBe('url');
      expect(source.locator).toBe(locator);
    });
  });

  describe('non-web scheme rejection (Directive 004R)', () => {
    it.each([
      'javascript:alert(1)',
      'data:text/plain,hello',
      'file:///tmp/example',
      'ftp://example.com',
      'mailto:test@example.com',
      'example.com',
      '//example.com',
      'not a url',
      '',
    ])('rejects %s', (locator) => {
      expect(() => createExternalSourceRef({ sourceKind: 'url', locator })).toThrow(
        DomainValidationError,
      );
    });
  });

  describe('non-url source kinds are unaffected by the http/https restriction (Directive 004R)', () => {
    it('accepts an opaque non-http(s) "file" locator', () => {
      const source = createExternalSourceRef({
        sourceKind: 'file',
        locator: 'asset://future-file-reference',
      });
      expect(source.sourceKind).toBe('file');
      expect(source.locator).toBe('asset://future-file-reference');
    });

    it('accepts an opaque "publication" locator', () => {
      const source = createExternalSourceRef({
        sourceKind: 'publication',
        locator: 'ISBN 978-3-16-148410-0',
      });
      expect(source.sourceKind).toBe('publication');
    });

    it('accepts an opaque "other" locator', () => {
      const source = createExternalSourceRef({
        sourceKind: 'other',
        locator: 'archive-reference-17',
      });
      expect(source.sourceKind).toBe('other');
      expect(source.locator).toBe('archive-reference-17');
    });
  });

  it('accepts a valid file opaque locator', () => {
    const source = createExternalSourceRef({
      sourceKind: 'file',
      locator: '/reference-material/notes.pdf',
    });
    expect(source.sourceKind).toBe('file');
    expect(source.locator).toBe('/reference-material/notes.pdf');
  });

  it('accepts a valid publication locator', () => {
    const source = createExternalSourceRef({
      sourceKind: 'publication',
      locator: 'ISBN 978-3-16-148410-0',
    });
    expect(source.sourceKind).toBe('publication');
  });

  it('accepts a valid other locator', () => {
    const source = createExternalSourceRef({
      sourceKind: 'other',
      locator: 'conversation with subject-matter expert, 2026-01-01',
    });
    expect(source.sourceKind).toBe('other');
  });

  it('rejects an empty locator', () => {
    expect(() => createExternalSourceRef({ sourceKind: 'file', locator: '' })).toThrow(
      DomainValidationError,
    );
  });

  it('rejects a whitespace-only locator', () => {
    expect(() => createExternalSourceRef({ sourceKind: 'other', locator: '   ' })).toThrow(
      DomainValidationError,
    );
  });

  it('trims an optional label', () => {
    const source = createExternalSourceRef({
      sourceKind: 'file',
      locator: '/x.pdf',
      label: '  Reference notes  ',
    });
    expect(source.label).toBe('Reference notes');
  });

  it('rejects an empty supplied label', () => {
    expect(() =>
      createExternalSourceRef({ sourceKind: 'file', locator: '/x.pdf', label: '   ' }),
    ).toThrow(DomainValidationError);
  });

  it('is frozen at runtime: cannot be mutated after creation', () => {
    const source = createExternalSourceRef({ sourceKind: 'file', locator: '/x.pdf' });
    expect(Object.isFrozen(source)).toBe(true);
    expect(() => {
      // @ts-expect-error ExternalSourceRef.locator is readonly at compile time too
      source.locator = 'evil';
    }).toThrow(TypeError);
    expect(source.locator).toBe('/x.pdf');
  });

  it('serializes to a stable plain-data shape', () => {
    const source = createExternalSourceRef({
      sourceKind: 'url',
      locator: 'https://example.com/a',
      label: 'Example',
    });
    const roundTripped = JSON.parse(JSON.stringify(source));
    expect(roundTripped).toEqual({
      sourceKind: 'url',
      locator: 'https://example.com/a',
      label: 'Example',
    });
  });

  it('omits label entirely from serialization when not supplied', () => {
    const source = createExternalSourceRef({ sourceKind: 'file', locator: '/x.pdf' });
    const roundTripped = JSON.parse(JSON.stringify(source));
    expect(roundTripped).toEqual({ sourceKind: 'file', locator: '/x.pdf' });
    expect('label' in roundTripped).toBe(false);
  });
});
