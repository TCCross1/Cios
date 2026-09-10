import { describe, expect, it } from 'vitest';
import { createProvenanceRecord } from '../src/index.js';
import { generateUniverseId, DomainValidationError } from '@cios/domain';

const universeId = generateUniverseId();

describe('ProvenanceRecord: hybrid semantics', () => {
  it('passes with both a creator contributor and an AI contributor', () => {
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'hybrid',
      contributors: [
        { contributorKind: 'creator', contributorRef: 'creator-1' },
        { contributorKind: 'ai', contributorRef: 'model-1' },
      ],
    });
    expect(record.provenanceType).toBe('hybrid');
  });

  it('fails with only a creator contributor', () => {
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'hybrid',
        contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
      }),
    ).toThrow(DomainValidationError);
  });

  it('fails with only an AI contributor', () => {
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'hybrid',
        contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      }),
    ).toThrow(DomainValidationError);
  });

  it('fails with zero contributors', () => {
    expect(() =>
      createProvenanceRecord({ universeId, provenanceType: 'hybrid', contributors: [] }),
    ).toThrow(DomainValidationError);
  });

  it('leaves parent lineage optional', () => {
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'hybrid',
      contributors: [
        { contributorKind: 'creator', contributorRef: 'creator-1' },
        { contributorKind: 'ai', contributorRef: 'model-1' },
      ],
    });
    expect(record.parents).toHaveLength(0);
  });
});
