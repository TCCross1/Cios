import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  createUniverseId,
  generateUniverseId,
  isUniverseId,
  createWorkId,
  generateWorkId,
  isWorkId,
  createEntityId,
  generateEntityId,
  isEntityId,
  DomainValidationError,
} from '../src/index.js';

const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function listSourceFiles(dir: string): string[] {
  const entries = readdirSync(dir);
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...listSourceFiles(fullPath));
    } else if (entry.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

describe('UniverseId', () => {
  it('accepts a syntactically valid UUID v4', () => {
    const id = createUniverseId('11111111-1111-4111-8111-111111111111');
    expect(isUniverseId(id)).toBe(true);
  });

  it('generates a valid, unique id', () => {
    const a = generateUniverseId();
    const b = generateUniverseId();
    expect(isUniverseId(a)).toBe(true);
    expect(a).not.toBe(b);
  });

  it('rejects a malformed id', () => {
    expect(() => createUniverseId('not-a-uuid')).toThrow(DomainValidationError);
    expect(() => createUniverseId('11111111-1111-1111-8111-111111111111')).toThrow(
      DomainValidationError,
    );
  });
});

describe('WorkId', () => {
  it('accepts a syntactically valid UUID v4', () => {
    const id = createWorkId('22222222-2222-4222-8222-222222222222');
    expect(isWorkId(id)).toBe(true);
  });

  it('generates a valid, unique id', () => {
    const a = generateWorkId();
    const b = generateWorkId();
    expect(isWorkId(a)).toBe(true);
    expect(a).not.toBe(b);
  });

  it('rejects a malformed id', () => {
    expect(() => createWorkId('')).toThrow(DomainValidationError);
  });
});

describe('EntityId', () => {
  it('accepts a syntactically valid UUID v4', () => {
    const id = createEntityId('33333333-3333-4333-8333-333333333333');
    expect(isEntityId(id)).toBe(true);
  });

  it('generates a valid, unique id', () => {
    const a = generateEntityId();
    const b = generateEntityId();
    expect(isEntityId(a)).toBe(true);
    expect(a).not.toBe(b);
  });

  it('rejects a malformed id', () => {
    expect(() => createEntityId('12345')).toThrow(DomainValidationError);
  });

  it('rejects a non-string value via the runtime guard', () => {
    expect(isEntityId(12345)).toBe(false);
    expect(isEntityId(null)).toBe(false);
    expect(isEntityId(undefined)).toBe(false);
  });

  it('generates a valid UUID v4', () => {
    const id = generateEntityId();
    expect(id).toMatch(UUID_V4_PATTERN);
  });
});

describe('ID portability (Directive 003R, section 26)', () => {
  const domainSrcDir = fileURLToPath(new URL('../src', import.meta.url));

  it('no source file in packages/domain imports node:crypto', () => {
    const offenders: string[] = [];
    for (const file of listSourceFiles(domainSrcDir)) {
      const content = readFileSync(file, 'utf8');
      if (
        /from\s+['"]node:crypto['"]/.test(content) ||
        /require\(\s*['"]node:crypto['"]\s*\)/.test(content)
      ) {
        offenders.push(file);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('generated UniverseId is a valid UUID v4', () => {
    expect(generateUniverseId()).toMatch(UUID_V4_PATTERN);
  });

  it('generated WorkId is a valid UUID v4', () => {
    expect(generateWorkId()).toMatch(UUID_V4_PATTERN);
  });

  it('generated EntityId is a valid UUID v4', () => {
    expect(generateEntityId()).toMatch(UUID_V4_PATTERN);
  });

  it('externally supplied valid IDs remain accepted', () => {
    expect(isUniverseId(createUniverseId('11111111-1111-4111-8111-111111111111'))).toBe(true);
    expect(isWorkId(createWorkId('22222222-2222-4222-8222-222222222222'))).toBe(true);
    expect(isEntityId(createEntityId('33333333-3333-4333-8333-333333333333'))).toBe(true);
  });

  it('malformed IDs remain rejected', () => {
    expect(() => createUniverseId('not-a-uuid')).toThrow(DomainValidationError);
    expect(() => createWorkId('not-a-uuid')).toThrow(DomainValidationError);
    expect(() => createEntityId('not-a-uuid')).toThrow(DomainValidationError);
  });
});
