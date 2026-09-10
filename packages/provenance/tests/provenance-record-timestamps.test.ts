import { describe, expect, it } from 'vitest';
import { createProvenanceRecord } from '../src/index.js';
import { generateUniverseId, DomainValidationError } from '@cios/domain';

describe('ProvenanceRecord: timestamp handling', () => {
  it('generates a default createdAt when none is supplied', () => {
    const universeId = generateUniverseId();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });
    expect(record.createdAt).toBeTruthy();
    expect(new Date(record.createdAt).toISOString()).toBe(record.createdAt);
  });

  it('accepts a valid supplied createdAt', () => {
    const universeId = generateUniverseId();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    expect(record.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('rejects an impossible calendar createdAt', () => {
    const universeId = generateUniverseId();
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'creator-original',
        contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
        createdAt: '2026-02-30T12:00:00.000Z',
      }),
    ).toThrow(DomainValidationError);
  });
});
