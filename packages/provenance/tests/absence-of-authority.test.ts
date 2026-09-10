import { describe, expect, it } from 'vitest';
import { createProvenanceRecord } from '../src/index.js';
import { generateUniverseId } from '@cios/domain';

const FORBIDDEN_AUTHORITY_FIELDS = [
  'canon',
  'isCanon',
  'canonState',
  'approved',
  'confidence',
  'quality',
  'authority',
  'updatedAt',
  'content',
  'metadata',
] as const;

const FORBIDDEN_SUBJECT_FIELDS = [
  'subject',
  'subjectId',
  'subjectType',
  'resourceType',
  'resourceId',
] as const;

describe('ProvenanceRecord: absence-of-authority', () => {
  it('does not carry any Canon/authority/quality field', () => {
    const universeId = generateUniverseId();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });

    for (const field of FORBIDDEN_AUTHORITY_FIELDS) {
      expect(field in record).toBe(false);
    }
  });

  it('exposes exactly the expected constitutional field set', () => {
    const universeId = generateUniverseId();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });

    expect(Object.keys(record).sort()).toEqual(
      [
        'contributors',
        'createdAt',
        'parents',
        'provenanceId',
        'provenanceType',
        'sources',
        'universeId',
      ].sort(),
    );
  });
});

describe('ProvenanceRecord: subjectless lineage', () => {
  it('does not expose a generic arbitrary subject namespace', () => {
    const universeId = generateUniverseId();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });

    for (const field of FORBIDDEN_SUBJECT_FIELDS) {
      expect(field in record).toBe(false);
    }
  });

  it('references other artifacts only via ProvenanceRef-shaped parents, not a subject pointer', () => {
    const universeId = generateUniverseId();
    const parent = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-suggestion',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      parents: [{ universeId, provenanceId: parent.provenanceId }],
    });

    expect(Object.keys(record.parents[0] ?? {}).sort()).toEqual(
      ['provenanceId', 'universeId'].sort(),
    );
  });
});
