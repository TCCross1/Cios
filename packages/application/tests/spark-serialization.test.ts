import { describe, expect, it } from 'vitest';
import { captureSpark } from '../src/spark/capture/capture-spark.js';
import { createSparkRef } from '../src/spark/references/spark-ref.js';
import { generateSparkId } from '../src/spark/ids/spark-id.js';
import { createSparkSource } from '../src/spark/source/spark-source.js';
import { createEntityScope, generateUniverseId } from '@cios/domain';
import { createProvenanceRecord } from '@cios/provenance';

function creatorOriginal(universeId: ReturnType<typeof generateUniverseId>) {
  return createProvenanceRecord({
    universeId,
    provenanceType: 'creator-original',
    contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
  });
}

describe('Spark serialization: JSON round-trip stability', () => {
  it('SparkId round-trips as a plain string', () => {
    const sparkId = generateSparkId();
    expect(JSON.parse(JSON.stringify(sparkId))).toBe(sparkId);
  });

  it('SparkRef round-trips as plain data', () => {
    const ref = createSparkRef({ universeId: generateUniverseId(), sparkId: generateSparkId() });
    expect(JSON.parse(JSON.stringify(ref))).toEqual(ref);
  });

  it.each([
    ['text', { modality: 'text', content: 'a raw idea' }],
    ['voice', { modality: 'voice', resourceRef: 'resource-voice-1' }],
    ['image', { modality: 'image', resourceRef: 'resource-image-1' }],
    ['link', { modality: 'link', url: 'https://example.com' }],
    ['file', { modality: 'file', resourceRef: 'resource-file-1' }],
  ] as const)('%s Spark round-trips as JSON-safe plain data', (_label, sourceInput) => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const provenanceRecord = creatorOriginal(universeId);
    const source = createSparkSource(sourceInput);

    const spark = captureSpark({ scope, provenanceRecord, source });
    const roundTripped = JSON.parse(JSON.stringify(spark));

    expect(roundTripped).toEqual({
      sparkId: spark.sparkId,
      universeId: spark.universeId,
      scope: spark.scope,
      provenanceRef: spark.provenanceRef,
      capturedAt: spark.capturedAt,
      source: spark.source,
    });
  });
});
