import { describe, expect, it } from 'vitest';
import { createProvenanceRecord } from '../src/index.js';
import { generateUniverseId, DomainValidationError } from '@cios/domain';

const universeId = generateUniverseId();

function makeParentRef() {
  const parent = createProvenanceRecord({
    universeId,
    provenanceType: 'creator-original',
    contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
  });
  return { universeId, provenanceId: parent.provenanceId };
}

describe('ProvenanceRecord: ai-interpretation semantics', () => {
  it('passes with an AI contributor and a parent', () => {
    const parent = makeParentRef();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-interpretation',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      parents: [parent],
    });
    expect(record.provenanceType).toBe('ai-interpretation');
  });

  it('fails with no AI contributor', () => {
    const parent = makeParentRef();
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'ai-interpretation',
        contributors: [],
        parents: [parent],
      }),
    ).toThrow(DomainValidationError);
  });

  it('fails when a creator contributor is present', () => {
    const parent = makeParentRef();
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'ai-interpretation',
        contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
        parents: [parent],
      }),
    ).toThrow(DomainValidationError);
  });

  it('fails with no parent', () => {
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'ai-interpretation',
        contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      }),
    ).toThrow(DomainValidationError);
  });
});

describe('ProvenanceRecord: ai-suggestion semantics', () => {
  it('passes with an AI contributor and no parent', () => {
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-suggestion',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
    });
    expect(record.parents).toHaveLength(0);
  });

  it('passes with an AI contributor and a parent', () => {
    const parent = makeParentRef();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-suggestion',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      parents: [parent],
    });
    expect(record.parents).toHaveLength(1);
  });

  it('fails with no AI contributor', () => {
    expect(() =>
      createProvenanceRecord({ universeId, provenanceType: 'ai-suggestion', contributors: [] }),
    ).toThrow(DomainValidationError);
  });

  it('fails when a creator contributor is present', () => {
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'ai-suggestion',
        contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
      }),
    ).toThrow(DomainValidationError);
  });
});

describe('ProvenanceRecord: ai-expansion semantics', () => {
  it('passes with an AI contributor and a parent', () => {
    const parent = makeParentRef();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-expansion',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      parents: [parent],
    });
    expect(record.provenanceType).toBe('ai-expansion');
  });

  it('fails with no parent', () => {
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'ai-expansion',
        contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      }),
    ).toThrow(DomainValidationError);
  });

  it('fails when a creator contributor is present', () => {
    const parent = makeParentRef();
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'ai-expansion',
        contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
        parents: [parent],
      }),
    ).toThrow(DomainValidationError);
  });
});

describe('ProvenanceRecord: ai-revision semantics', () => {
  it('passes with an AI contributor and a parent', () => {
    const parent = makeParentRef();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-revision',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      parents: [parent],
    });
    expect(record.provenanceType).toBe('ai-revision');
  });

  it('fails with no parent', () => {
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'ai-revision',
        contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      }),
    ).toThrow(DomainValidationError);
  });

  it('fails when a creator contributor is present', () => {
    const parent = makeParentRef();
    expect(() =>
      createProvenanceRecord({
        universeId,
        provenanceType: 'ai-revision',
        contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
        parents: [parent],
      }),
    ).toThrow(DomainValidationError);
  });
});
