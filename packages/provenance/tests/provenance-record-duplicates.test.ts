import { describe, expect, it } from 'vitest';
import { createProvenanceRecord } from '../src/index.js';
import { generateUniverseId, DomainValidationError } from '@cios/domain';

describe('ProvenanceRecord: duplicate detection', () => {
  it('rejects an exact duplicate contributor (same kind + same normalized ref)', () => {
    const universeId = generateUniverseId();
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'creator-original',
        contributors: [
          { contributorKind: 'creator', contributorRef: 'creator-1' },
          { contributorKind: 'creator', contributorRef: '  creator-1  ' },
        ],
      }),
    ).toThrow(DomainValidationError);
  });

  it('treats a meaningfully different contributorRef (after trim) as distinct', () => {
    const universeId = generateUniverseId();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'hybrid',
      contributors: [
        { contributorKind: 'creator', contributorRef: 'creator-1' },
        { contributorKind: 'creator', contributorRef: 'creator-2' },
        { contributorKind: 'ai', contributorRef: 'model-1' },
      ],
    });
    expect(record.contributors).toHaveLength(3);
  });

  it('rejects an exact duplicate source (same sourceKind + normalized locator)', () => {
    const universeId = generateUniverseId();
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'imported-reference',
        sources: [
          { sourceKind: 'file', locator: '/notes.pdf' },
          { sourceKind: 'file', locator: '/notes.pdf' },
        ],
      }),
    ).toThrow(DomainValidationError);
  });

  it('allows a different sourceKind reusing the same locator string', () => {
    const universeId = generateUniverseId();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'imported-reference',
      sources: [
        { sourceKind: 'file', locator: 'reference-id-42' },
        { sourceKind: 'other', locator: 'reference-id-42' },
      ],
    });
    expect(record.sources).toHaveLength(2);
  });
});
