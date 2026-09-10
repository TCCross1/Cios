import { describe, expect, it } from 'vitest';
import {
  createSparkId,
  generateSparkId,
  isSparkId,
  type SparkId,
} from '../src/spark/ids/spark-id.js';
import { generateUniverseId, generateWorkId, generateEntityId, DomainValidationError } from '@cios/domain';
import { generateProvenanceId } from '@cios/provenance';

describe('SparkId', () => {
  it('accepts a valid caller-supplied UUID v4 string', () => {
    const raw = generateUniverseId() as unknown as string; // any valid UUID v4 syntax
    const sparkId = createSparkId(raw);
    expect(sparkId).toBe(raw);
  });

  it('rejects a malformed value', () => {
    expect(() => createSparkId('not-a-uuid')).toThrow(DomainValidationError);
    expect(() => createSparkId('')).toThrow(DomainValidationError);
  });

  it('rejects a value with the wrong UUID version nibble', () => {
    expect(() => createSparkId('11111111-1111-1111-8111-111111111111')).toThrow(
      DomainValidationError,
    );
  });

  it('isSparkId is a true runtime guard, not just a cast', () => {
    expect(isSparkId('not-a-uuid')).toBe(false);
    expect(isSparkId(generateSparkId())).toBe(true);
    expect(isSparkId(12345)).toBe(false);
    expect(isSparkId(null)).toBe(false);
  });

  it('generateSparkId produces a syntactically valid UUID v4', () => {
    const sparkId = generateSparkId();
    expect(sparkId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('generation produces distinct values across calls', () => {
    const a = generateSparkId();
    const b = generateSparkId();
    expect(a).not.toBe(b);
  });

  it('generation uses globalThis.crypto.randomUUID, not Math.random', () => {
    const originalCrypto = globalThis.crypto;
    let called = false;
    Object.defineProperty(globalThis, 'crypto', {
      value: {
        randomUUID: () => {
          called = true;
          return originalCrypto.randomUUID();
        },
      },
      configurable: true,
    });
    try {
      generateSparkId();
      expect(called).toBe(true);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
      });
    }
  });

  it('fails clearly (does not fall back to Math.random) when crypto is unavailable', () => {
    const originalCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true });
    try {
      expect(() => generateSparkId()).toThrow(DomainValidationError);
    } finally {
      Object.defineProperty(globalThis, 'crypto', {
        value: originalCrypto,
        configurable: true,
      });
    }
  });

  it('serializes as a plain string with no residual brand at runtime', () => {
    const sparkId: SparkId = generateSparkId();
    const roundTripped = JSON.parse(JSON.stringify({ sparkId }));
    expect(typeof roundTripped.sparkId).toBe('string');
    expect(roundTripped.sparkId).toBe(sparkId);
  });

  it('compile-time: SparkId is not assignable to/from UniverseId, WorkId, EntityId, or ProvenanceId', () => {
    const sparkId = generateSparkId();
    const universeId = generateUniverseId();
    const workId = generateWorkId();
    const entityId = generateEntityId();
    const provenanceId = generateProvenanceId();

    // @ts-expect-error SparkId is not assignable to UniverseId
    const asUniverseId: typeof universeId = sparkId;
    // @ts-expect-error SparkId is not assignable to WorkId
    const asWorkId: typeof workId = sparkId;
    // @ts-expect-error SparkId is not assignable to EntityId
    const asEntityId: typeof entityId = sparkId;
    // @ts-expect-error SparkId is not assignable to ProvenanceId
    const asProvenanceId: typeof provenanceId = sparkId;
    // @ts-expect-error UniverseId is not assignable to SparkId
    const asSparkId: typeof sparkId = universeId;

    expect([asUniverseId, asWorkId, asEntityId, asProvenanceId, asSparkId]).toEqual([
      sparkId,
      sparkId,
      sparkId,
      sparkId,
      universeId,
    ]);
  });
});
