import { describe, expect, it } from 'vitest';
import { createProvenanceRecord } from '../src/index.js';
import { generateUniverseId, DomainValidationError } from '@cios/domain';

describe('ProvenanceRecord: parent lineage', () => {
  it('accepts a same-universe parent', () => {
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
    expect(record.parents).toHaveLength(1);
  });

  it('accepts multiple distinct same-universe parents', () => {
    const universeId = generateUniverseId();
    const parentA = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });
    const parentB = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-2' }],
    });
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-suggestion',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      parents: [
        { universeId, provenanceId: parentA.provenanceId },
        { universeId, provenanceId: parentB.provenanceId },
      ],
    });
    expect(record.parents).toHaveLength(2);
  });

  it('rejects a cross-universe parent', () => {
    const universeId = generateUniverseId();
    const otherUniverseId = generateUniverseId();
    const parent = createProvenanceRecord({
      universeId: otherUniverseId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'ai-suggestion',
        contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
        parents: [{ universeId: otherUniverseId, provenanceId: parent.provenanceId }],
      }),
    ).toThrow(DomainValidationError);
  });

  it('rejects a direct self-parent', () => {
    const universeId = generateUniverseId();
    expect(() => {
      // A record cannot reference its own not-yet-assigned id; simulate
      // self-parenting by supplying a caller-chosen provenanceId that is
      // also used as its own parent reference.
      const selfId = '11111111-1111-4111-8111-111111111111';
      return createProvenanceRecord({
        universeId,
        provenanceId: selfId as never,
        provenanceType: 'ai-suggestion',
        contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
        parents: [{ universeId, provenanceId: selfId as never }],
      });
    }).toThrow(DomainValidationError);
  });

  it('rejects a duplicate parent', () => {
    const universeId = generateUniverseId();
    const parent = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'ai-suggestion',
        contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
        parents: [
          { universeId, provenanceId: parent.provenanceId },
          { universeId, provenanceId: parent.provenanceId },
        ],
      }),
    ).toThrow(DomainValidationError);
  });

  it('rejects a malformed parent', () => {
    const universeId = generateUniverseId();
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'ai-suggestion',
        contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
        parents: [{ universeId, provenanceId: 'not-a-uuid' as never }],
      }),
    ).toThrow(DomainValidationError);
  });

  it('does not claim parent existence is validated against any global store', () => {
    const universeId = generateUniverseId();
    const unknownButWellFormedId = '22222222-2222-4222-8222-222222222222';
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-suggestion',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      parents: [{ universeId, provenanceId: unknownButWellFormedId as never }],
    });
    expect(record.parents).toHaveLength(1);
  });

  it('does not detect indirect cycles across separately constructed records', () => {
    const universeId = generateUniverseId();
    const recordA = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });
    const recordB = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-suggestion',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      parents: [{ universeId, provenanceId: recordA.provenanceId }],
    });
    // A hypothetical recordC referencing recordB as a parent, forming an
    // indirect chain, is permitted; no cross-record cycle detection is
    // implemented or claimed.
    const recordC = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-suggestion',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      parents: [{ universeId, provenanceId: recordB.provenanceId }],
    });
    expect(recordC.parents[0]?.provenanceId).toBe(recordB.provenanceId);
  });
});
