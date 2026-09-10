import { describe, expect, it } from 'vitest';
import { createProvenanceContributorRef } from '../src/index.js';
import { DomainValidationError } from '@cios/domain';

describe('ProvenanceContributorRef', () => {
  it('accepts a valid creator contributor', () => {
    const contributor = createProvenanceContributorRef({
      contributorKind: 'creator',
      contributorRef: 'creator-account-123',
    });
    expect(contributor).toEqual({
      contributorKind: 'creator',
      contributorRef: 'creator-account-123',
    });
  });

  it('accepts a valid ai contributor', () => {
    const contributor = createProvenanceContributorRef({
      contributorKind: 'ai',
      contributorRef: 'provider:model-x',
    });
    expect(contributor).toEqual({ contributorKind: 'ai', contributorRef: 'provider:model-x' });
  });

  it('rejects an unrecognized contributorKind', () => {
    expect(() =>
      createProvenanceContributorRef({
        // @ts-expect-error intentionally invalid contributorKind for a runtime-rejection test
        contributorKind: 'robot',
        contributorRef: 'x',
      }),
    ).toThrow(DomainValidationError);
  });

  it('trims contributorRef', () => {
    const contributor = createProvenanceContributorRef({
      contributorKind: 'creator',
      contributorRef: '  padded-ref  ',
    });
    expect(contributor.contributorRef).toBe('padded-ref');
  });

  it('rejects a whitespace-only contributorRef', () => {
    expect(() =>
      createProvenanceContributorRef({ contributorKind: 'creator', contributorRef: '   ' }),
    ).toThrow(DomainValidationError);
  });

  it('rejects an empty contributorRef', () => {
    expect(() =>
      createProvenanceContributorRef({ contributorKind: 'creator', contributorRef: '' }),
    ).toThrow(DomainValidationError);
  });

  it('is frozen at runtime: cannot be mutated after creation', () => {
    const contributor = createProvenanceContributorRef({
      contributorKind: 'creator',
      contributorRef: 'ref-1',
    });
    expect(Object.isFrozen(contributor)).toBe(true);
    expect(() => {
      // @ts-expect-error ProvenanceContributorRef.contributorRef is readonly at compile time too
      contributor.contributorRef = 'evil';
    }).toThrow(TypeError);
    expect(contributor.contributorRef).toBe('ref-1');
  });

  it('serializes to a stable plain-data shape', () => {
    const contributor = createProvenanceContributorRef({
      contributorKind: 'ai',
      contributorRef: 'model-y',
    });
    const roundTripped = JSON.parse(JSON.stringify(contributor));
    expect(roundTripped).toEqual({ contributorKind: 'ai', contributorRef: 'model-y' });
  });
});
