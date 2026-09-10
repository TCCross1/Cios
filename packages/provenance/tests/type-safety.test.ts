import { describe, expect, it } from 'vitest';
import { createProvenanceRecord, type ProvenanceContributorKind } from '../src/index.js';
import { generateUniverseId } from '@cios/domain';

describe('ProvenanceRecord: compile-time type safety', () => {
  it('does not allow constructing a record with an obsolete/forbidden field', () => {
    const universeId = generateUniverseId();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
      // @ts-expect-error `updatedAt` is not part of CreateProvenanceRecordInput
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    expect(record.provenanceType).toBe('creator-original');
  });

  it('does not allow reading an obsolete/forbidden field off a constructed record', () => {
    const universeId = generateUniverseId();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });

    // @ts-expect-error ProvenanceRecord has no `subject` field
    const subject = record.subject;
    // @ts-expect-error ProvenanceRecord has no `canon` field
    const canon = record.canon;
    // @ts-expect-error ProvenanceRecord has no `updatedAt` field
    const updatedAt = record.updatedAt;

    expect([subject, canon, updatedAt]).toEqual([undefined, undefined, undefined]);
  });

  it('does not allow mutating readonly ProvenanceRecord collections at compile time', () => {
    const universeId = generateUniverseId();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });

    expect(() => {
      // @ts-expect-error record.contributors is a readonly array at compile time
      record.contributors.push({ contributorKind: 'ai', contributorRef: 'model-1' });
    }).toThrow(TypeError);
  });

  it('exports ProvenanceContributorKind and rejects the obsolete ContributorKind name (Directive 004R)', async () => {
    const provenanceModule = await import('../src/index.js');
    const value: ProvenanceContributorKind = 'creator';
    expect(['creator', 'ai']).toContain(value);
    expect(provenanceModule.isProvenanceContributorKind('creator')).toBe(true);

    // @ts-expect-error `ContributorKind` is not exported from the public API — only
    // `ProvenanceContributorKind` is the supported name (Directive 004R).
    const obsolete: ContributorKind = 'creator';
    expect(obsolete).toBe('creator');

    // @ts-expect-error `isContributorKind` is not exported from the public API — only
    // `isProvenanceContributorKind` is the supported name (Directive 004R).
    expect(provenanceModule.isContributorKind).toBeUndefined();
  });
});
