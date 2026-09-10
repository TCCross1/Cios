import { describe, expect, it } from 'vitest';
import { createProvenanceRecord } from '../src/index.js';
import { generateUniverseId, DomainValidationError } from '@cios/domain';

const universeId = generateUniverseId();

describe('ProvenanceRecord: creator-original semantics', () => {
  it('passes with a creator contributor', () => {
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });
    expect(record.provenanceType).toBe('creator-original');
  });

  it('fails with zero creator contributors', () => {
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'creator-original',
        contributors: [],
      }),
    ).toThrow(DomainValidationError);
  });

  it('fails when it contains an AI contributor', () => {
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'creator-original',
        contributors: [
          { contributorKind: 'creator', contributorRef: 'creator-1' },
          { contributorKind: 'ai', contributorRef: 'model-1' },
        ],
      }),
    ).toThrow(DomainValidationError);
  });

  it('allows parent lineage', () => {
    const parentRecord = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
      parents: [{ universeId, provenanceId: parentRecord.provenanceId }],
    });
    expect(record.parents).toHaveLength(1);
  });

  it('allows optional source references', () => {
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
      sources: [{ sourceKind: 'other', locator: 'inspiration note' }],
    });
    expect(record.sources).toHaveLength(1);
  });
});
