import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  createProvenanceId,
  generateProvenanceId,
  isProvenanceId,
  createProvenanceRef,
  type ProvenanceId,
} from '../src/index.js';
import {
  generateUniverseId,
  DomainValidationError,
  type UniverseId,
  type EntityId,
  type WorkId,
} from '@cios/domain';

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

const provenanceSrcDir = fileURLToPath(new URL('../src', import.meta.url));

describe('ProvenanceId', () => {
  it('accepts a valid caller-supplied UUID v4', () => {
    const id = createProvenanceId('11111111-1111-4111-8111-111111111111');
    expect(isProvenanceId(id)).toBe(true);
  });

  it('rejects a malformed UUID', () => {
    expect(() => createProvenanceId('not-a-uuid')).toThrow(DomainValidationError);
    expect(() => createProvenanceId('11111111-1111-1111-8111-111111111111')).toThrow(
      DomainValidationError,
    );
  });

  it('generates a valid ProvenanceId that passes validation', () => {
    const id = generateProvenanceId();
    expect(isProvenanceId(id)).toBe(true);
    expect(id).toMatch(UUID_V4_PATTERN);
  });

  it('generates unique ids', () => {
    expect(generateProvenanceId()).not.toBe(generateProvenanceId());
  });

  it('JSON-serializes as a plain string', () => {
    const id = generateProvenanceId();
    expect(JSON.parse(JSON.stringify({ id }))).toEqual({ id });
    expect(typeof JSON.parse(JSON.stringify(id))).toBe('string');
  });

  it('no source file in packages/provenance imports node:crypto', () => {
    const offenders: string[] = [];
    for (const file of listSourceFiles(provenanceSrcDir)) {
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

  it('is not compile-time assignable to/from @cios/domain UniverseId/EntityId/WorkId', () => {
    const provenanceId: ProvenanceId = generateProvenanceId();
    const universeId = generateUniverseId();

    // @ts-expect-error ProvenanceId is not a UniverseId
    const asUniverseId: UniverseId = provenanceId;
    // @ts-expect-error UniverseId is not a ProvenanceId
    const asProvenanceIdFromUniverse: ProvenanceId = universeId;
    // @ts-expect-error ProvenanceId is not an EntityId
    const asEntityId: EntityId = provenanceId;
    // @ts-expect-error ProvenanceId is not a WorkId
    const asWorkId: WorkId = provenanceId;

    expect([asUniverseId, asProvenanceIdFromUniverse, asEntityId, asWorkId]).toBeDefined();
  });

  it('the shared ProvenanceRef construction path still re-validates a pre-branded id', () => {
    const universeId = generateUniverseId();
    const provenanceId = generateProvenanceId();
    const ref = createProvenanceRef({ universeId, provenanceId });
    expect(ref.provenanceId).toBe(provenanceId);
  });
});
