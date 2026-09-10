import { describe, expect, it } from 'vitest';
import { createProvenanceRecord } from '../src/index.js';
import { generateUniverseId, DomainValidationError } from '@cios/domain';

const universeId = generateUniverseId();

describe('ProvenanceRecord: imported-reference semantics', () => {
  it('passes with an external source present', () => {
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'imported-reference',
      sources: [{ sourceKind: 'url', locator: 'https://example.com/article' }],
    });
    expect(record.provenanceType).toBe('imported-reference');
  });

  it('passes with multiple sources', () => {
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'imported-reference',
      sources: [
        { sourceKind: 'url', locator: 'https://example.com/article' },
        { sourceKind: 'file', locator: '/notes.pdf' },
      ],
    });
    expect(record.sources).toHaveLength(2);
  });

  it('fails with zero external sources', () => {
    expect(() =>
      createProvenanceRecord({ universeId, provenanceType: 'imported-reference', sources: [] }),
    ).toThrow(DomainValidationError);
  });

  it('allows contributors to be empty', () => {
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'imported-reference',
      contributors: [],
      sources: [{ sourceKind: 'other', locator: 'field notes' }],
    });
    expect(record.contributors).toHaveLength(0);
  });

  it('does not carry any canon or authority marker', () => {
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'imported-reference',
      sources: [{ sourceKind: 'other', locator: 'field notes' }],
    });
    expect('canon' in record).toBe(false);
    expect('isCanon' in record).toBe(false);
    expect('approved' in record).toBe(false);
  });
});
