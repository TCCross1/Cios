import { describe, expect, it } from 'vitest';
import { captureSpark } from '../src/spark/capture/capture-spark.js';
import { createSparkRef } from '../src/spark/references/spark-ref.js';
import { generateSparkId } from '../src/spark/ids/spark-id.js';
import {
  createEntityScope,
  generateUniverseId,
  generateWorkId,
  DomainValidationError,
} from '@cios/domain';
import { createProvenanceRecord } from '@cios/provenance';

function makeCreatorOriginalRecord(universeId: ReturnType<typeof generateUniverseId>) {
  return createProvenanceRecord({
    universeId,
    provenanceType: 'creator-original',
    contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
  });
}

function makeImportedReferenceRecord(universeId: ReturnType<typeof generateUniverseId>) {
  return createProvenanceRecord({
    universeId,
    provenanceType: 'imported-reference',
    sources: [{ sourceKind: 'url', locator: 'https://example.com/reference-article' }],
  });
}

describe('captureSpark: creator-original acquisition', () => {
  it('succeeds and produces a well-formed, isolated Spark', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const provenanceRecord = makeCreatorOriginalRecord(universeId);

    const spark = captureSpark({
      scope,
      provenanceRecord,
      source: { modality: 'text', content: 'a sudden idea' },
    });

    expect(spark.universeId).toBe(universeId);
    expect(spark.scope).toEqual(scope);
    expect(spark.provenanceRef).toEqual({
      universeId: provenanceRecord.universeId,
      provenanceId: provenanceRecord.provenanceId,
    });
    // The full record is not embedded — only the reference.
    expect((spark as unknown as { provenanceRecord?: unknown }).provenanceRecord).toBeUndefined();
    expect(spark.source).toEqual({ modality: 'text', content: 'a sudden idea' });
    expect(typeof spark.capturedAt).toBe('string');
    expect(Object.isFrozen(spark)).toBe(true);
  });
});

describe('captureSpark: imported-reference acquisition', () => {
  it('succeeds with the same reference/isolation behavior', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const provenanceRecord = makeImportedReferenceRecord(universeId);

    const spark = captureSpark({
      scope,
      provenanceRecord,
      source: { modality: 'link', url: 'https://example.com/inspiration' },
    });

    expect(spark.universeId).toBe(universeId);
    expect(spark.provenanceRef).toEqual({
      universeId: provenanceRecord.universeId,
      provenanceId: provenanceRecord.provenanceId,
    });
    expect((spark as unknown as { provenanceRecord?: unknown }).provenanceRecord).toBeUndefined();
    expect(Object.isFrozen(spark)).toBe(true);
  });
});

describe('captureSpark: disallowed AI/hybrid provenance rejection', () => {
  it('rejects ai-interpretation', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const parent = makeCreatorOriginalRecord(universeId);
    const provenanceRecord = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-interpretation',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      parents: [{ universeId, provenanceId: parent.provenanceId }],
    });

    expect(() =>
      captureSpark({ scope, provenanceRecord, source: { modality: 'text', content: 'x' } }),
    ).toThrow(DomainValidationError);
    try {
      captureSpark({ scope, provenanceRecord, source: { modality: 'text', content: 'x' } });
    } catch (error) {
      expect((error as DomainValidationError).code).toBe(
        'spark_capture.provenance_type_not_permitted',
      );
    }
  });

  it('rejects ai-suggestion', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const provenanceRecord = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-suggestion',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
    });

    expect(() =>
      captureSpark({ scope, provenanceRecord, source: { modality: 'text', content: 'x' } }),
    ).toThrow(DomainValidationError);
  });

  it('rejects ai-expansion', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const parent = makeCreatorOriginalRecord(universeId);
    const provenanceRecord = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-expansion',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      parents: [{ universeId, provenanceId: parent.provenanceId }],
    });

    expect(() =>
      captureSpark({ scope, provenanceRecord, source: { modality: 'text', content: 'x' } }),
    ).toThrow(DomainValidationError);
  });

  it('rejects ai-revision', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const parent = makeCreatorOriginalRecord(universeId);
    const provenanceRecord = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-revision',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      parents: [{ universeId, provenanceId: parent.provenanceId }],
    });

    expect(() =>
      captureSpark({ scope, provenanceRecord, source: { modality: 'text', content: 'x' } }),
    ).toThrow(DomainValidationError);
  });

  it('rejects hybrid', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const provenanceRecord = createProvenanceRecord({
      universeId,
      provenanceType: 'hybrid',
      contributors: [
        { contributorKind: 'creator', contributorRef: 'creator-1' },
        { contributorKind: 'ai', contributorRef: 'model-1' },
      ],
    });

    expect(() =>
      captureSpark({ scope, provenanceRecord, source: { modality: 'text', content: 'x' } }),
    ).toThrow(DomainValidationError);
  });
});

describe('captureSpark: cross-universe rejection', () => {
  it('rejects a valid creator-original record from a different universe', () => {
    const scopeUniverseId = generateUniverseId();
    const provenanceUniverseId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId: scopeUniverseId });
    const provenanceRecord = makeCreatorOriginalRecord(provenanceUniverseId);

    expect(() =>
      captureSpark({ scope, provenanceRecord, source: { modality: 'text', content: 'x' } }),
    ).toThrow(DomainValidationError);

    try {
      captureSpark({ scope, provenanceRecord, source: { modality: 'text', content: 'x' } });
      throw new Error('expected captureSpark to throw');
    } catch (error) {
      expect((error as DomainValidationError).code).toBe('spark_capture.cross_universe_provenance');
    }
  });

  it('rejects a valid imported-reference record from a different universe', () => {
    const scopeUniverseId = generateUniverseId();
    const provenanceUniverseId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId: scopeUniverseId });
    const provenanceRecord = makeImportedReferenceRecord(provenanceUniverseId);

    expect(() =>
      captureSpark({
        scope,
        provenanceRecord,
        source: { modality: 'link', url: 'https://example.com' },
      }),
    ).toThrow(DomainValidationError);
  });
});

describe('captureSpark: provenance malformed-object adversarial tests', () => {
  it('rejects a runtime-malformed provenanceRecord bypassing TypeScript', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const malformedRecord = {
      provenanceId: 'not-a-valid-id',
      universeId,
      provenanceType: 'creator-original',
    } as unknown as ReturnType<typeof makeCreatorOriginalRecord>;

    expect(() =>
      captureSpark({
        scope,
        provenanceRecord: malformedRecord,
        source: { modality: 'text', content: 'x' },
      }),
    ).toThrow(DomainValidationError);
  });

  it('rejects a provenanceRecord with a malformed provenanceType', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const malformedRecord = {
      provenanceId: generateSparkId(), // syntactically a valid UUID, wrong type entirely
      universeId,
      provenanceType: 'not-a-real-provenance-type',
    } as unknown as ReturnType<typeof makeCreatorOriginalRecord>;

    expect(() =>
      captureSpark({
        scope,
        provenanceRecord: malformedRecord,
        source: { modality: 'text', content: 'x' },
      }),
    ).toThrow(DomainValidationError);
  });

  it('does not construct a malformed SparkRef merely because a caller bypassed TypeScript', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const malformedRecord = {
      provenanceId: 'totally-invalid',
      universeId,
      provenanceType: 'imported-reference',
    } as unknown as ReturnType<typeof makeImportedReferenceRecord>;

    expect(() =>
      captureSpark({
        scope,
        provenanceRecord: malformedRecord,
        source: { modality: 'text', content: 'x' },
      }),
    ).toThrow(DomainValidationError);
  });

  it('rejects a malformed scope object bypassing TypeScript', () => {
    const universeId = generateUniverseId();
    const provenanceRecord = makeCreatorOriginalRecord(universeId);

    expect(() =>
      captureSpark({
        scope: { kind: 'universe', universeId: 'not-a-universe-id' } as never,
        provenanceRecord,
        source: { modality: 'text', content: 'x' },
      }),
    ).toThrow(DomainValidationError);

    expect(() =>
      captureSpark({
        scope: { kind: 'nonsense' } as never,
        provenanceRecord,
        source: { modality: 'text', content: 'x' },
      }),
    ).toThrow(DomainValidationError);
  });
});

describe('captureSpark: capturedAt', () => {
  it('generates a valid UtcTimestamp when omitted', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const provenanceRecord = makeCreatorOriginalRecord(universeId);

    const spark = captureSpark({
      scope,
      provenanceRecord,
      source: { modality: 'text', content: 'x' },
    });
    expect(spark.capturedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('accepts a valid supplied timestamp', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const provenanceRecord = makeCreatorOriginalRecord(universeId);

    const spark = captureSpark({
      scope,
      provenanceRecord,
      capturedAt: '2026-01-01T00:00:00.000Z' as never,
      source: { modality: 'text', content: 'x' },
    });
    expect(spark.capturedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('rejects a calendar-impossible timestamp', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const provenanceRecord = makeCreatorOriginalRecord(universeId);

    expect(() =>
      captureSpark({
        scope,
        provenanceRecord,
        capturedAt: '2026-02-30T12:00:00.000Z' as never,
        source: { modality: 'text', content: 'x' },
      }),
    ).toThrow(DomainValidationError);
  });
});

describe('captureSpark: runtime immutability and caller-reference isolation', () => {
  it('Spark, its scope, and its source are all frozen', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const provenanceRecord = makeCreatorOriginalRecord(universeId);

    const spark = captureSpark({
      scope,
      provenanceRecord,
      source: { modality: 'text', content: 'x' },
    });

    expect(Object.isFrozen(spark)).toBe(true);
    expect(Object.isFrozen(spark.scope)).toBe(true);
    expect(Object.isFrozen(spark.source)).toBe(true);
    expect(Object.isFrozen(spark.provenanceRef)).toBe(true);
  });

  it('mutating a caller-retained mutable source object after capture does not affect the Spark', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const provenanceRecord = makeCreatorOriginalRecord(universeId);
    const mutableSource: { modality: 'text'; content: string } = {
      modality: 'text',
      content: 'original text',
    };

    const spark = captureSpark({ scope, provenanceRecord, source: mutableSource });
    mutableSource.content = 'mutated after capture';

    expect(spark.source).toEqual({ modality: 'text', content: 'original text' });
  });

  it('mutating a caller-retained mutable scope object after capture does not affect the Spark', () => {
    const universeId = generateUniverseId();
    const mutableScope: { kind: 'universe'; universeId: typeof universeId } = {
      kind: 'universe',
      universeId,
    };
    const provenanceRecord = makeCreatorOriginalRecord(universeId);

    const spark = captureSpark({
      scope: mutableScope,
      provenanceRecord,
      source: { modality: 'text', content: 'x' },
    });
    // Deliberately mutating a caller-owned object to prove isolation.
    mutableScope.universeId = generateUniverseId();

    expect(spark.scope.universeId).toBe(universeId);
    expect(spark.universeId).toBe(universeId);
  });

  it('preserves the exact raw text string through capture', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const provenanceRecord = makeCreatorOriginalRecord(universeId);
    const content = '  The moon remembers us.\n';

    const spark = captureSpark({ scope, provenanceRecord, source: { modality: 'text', content } });
    expect(spark.source).toEqual({ modality: 'text', content });
    if (spark.source.modality === 'text') {
      expect(spark.source.content).toBe(content);
    }
  });
});

describe('captureSpark: work-scoped capture', () => {
  it('supports a work-scoped Spark and enforces scope.universeId === spark.universeId', () => {
    const universeId = generateUniverseId();
    const workId = generateWorkId();
    const scope = createEntityScope({ kind: 'work', universeId, workId });
    const provenanceRecord = makeCreatorOriginalRecord(universeId);

    const spark = captureSpark({
      scope,
      provenanceRecord,
      source: { modality: 'text', content: 'x' },
    });

    expect(spark.universeId).toBe(spark.scope.universeId);
    expect(spark.scope).toEqual({ kind: 'work', universeId, workId });
  });
});

describe('createSparkRef usable independently of capture', () => {
  it('produces a frozen SparkRef referencing a captured Spark without embedding its content', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const provenanceRecord = makeCreatorOriginalRecord(universeId);
    const spark = captureSpark({
      scope,
      provenanceRecord,
      source: { modality: 'text', content: 'secret raw idea' },
    });

    const ref = createSparkRef({ universeId: spark.universeId, sparkId: spark.sparkId });
    expect(ref).toEqual({ universeId: spark.universeId, sparkId: spark.sparkId });
    expect((ref as unknown as { content?: unknown }).content).toBeUndefined();
  });
});
