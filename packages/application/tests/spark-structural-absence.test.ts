import { describe, expect, it } from 'vitest';
import { captureSpark } from '../src/spark/capture/capture-spark.js';
import { createEntityScope, generateUniverseId } from '@cios/domain';
import { createProvenanceRecord } from '@cios/provenance';

const DISALLOWED_FIELDS = [
  'updatedAt',
  'lifecycleState',
  'title',
  'summary',
  'interpretation',
  'transcript',
  'ocr',
  'tags',
  'embedding',
  'entityId',
  'entityKind',
  'canon',
  'canonState',
  'approved',
  'confidence',
  'metadata',
  'provenanceRecord',
] as const;

describe('Spark: structural absence / Canon separation regression', () => {
  it('does not expose any field representing interpretation, Canon, or lifecycle state', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    const provenanceRecord = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });

    const spark = captureSpark({
      scope,
      provenanceRecord,
      source: { modality: 'text', content: 'a spark of an idea' },
    });

    for (const field of DISALLOWED_FIELDS) {
      expect(Object.prototype.hasOwnProperty.call(spark, field)).toBe(false);
    }

    expect(Object.keys(spark).sort()).toEqual(
      ['capturedAt', 'provenanceRef', 'scope', 'source', 'sparkId', 'universeId'].sort(),
    );
  });
});
