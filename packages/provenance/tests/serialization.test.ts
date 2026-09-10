import { describe, expect, it } from 'vitest';
import {
  createProvenanceRecord,
  createProvenanceRef,
  createProvenanceContributorRef,
  createExternalSourceRef,
  generateProvenanceId,
} from '../src/index.js';
import { generateUniverseId } from '@cios/domain';

describe('ProvenanceRecord and value objects: JSON round-trip serialization', () => {
  it('round-trips a ProvenanceId', () => {
    const id = generateProvenanceId();
    expect(JSON.parse(JSON.stringify(id))).toBe(id);
  });

  it('round-trips a ProvenanceContributorRef', () => {
    const contributor = createProvenanceContributorRef({
      contributorKind: 'creator',
      contributorRef: 'creator-1',
    });
    expect(JSON.parse(JSON.stringify(contributor))).toEqual(contributor);
  });

  it('round-trips an ExternalSourceRef', () => {
    const source = createExternalSourceRef({
      sourceKind: 'url',
      locator: 'https://example.com/a',
      label: 'Example',
    });
    expect(JSON.parse(JSON.stringify(source))).toEqual(source);
  });

  it('round-trips a ProvenanceRef', () => {
    const ref = createProvenanceRef({
      universeId: generateUniverseId(),
      provenanceId: generateProvenanceId(),
    });
    expect(JSON.parse(JSON.stringify(ref))).toEqual(ref);
  });

  it('round-trips a creator-original ProvenanceRecord', () => {
    const universeId = generateUniverseId();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });
    expect(JSON.parse(JSON.stringify(record))).toEqual(record);
  });

  it('round-trips an AI-derived ProvenanceRecord', () => {
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
    expect(JSON.parse(JSON.stringify(record))).toEqual(record);
  });

  it('round-trips an imported-reference ProvenanceRecord', () => {
    const universeId = generateUniverseId();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'imported-reference',
      sources: [{ sourceKind: 'url', locator: 'https://example.com/a' }],
    });
    expect(JSON.parse(JSON.stringify(record))).toEqual(record);
  });

  it('contains no Map, Set, function, or class-instance state anywhere in the record', () => {
    const universeId = generateUniverseId();
    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'imported-reference',
      sources: [{ sourceKind: 'url', locator: 'https://example.com/a' }],
    });
    const serialized = JSON.stringify(record);
    expect(serialized).not.toContain('undefined');
    expect(record).not.toBeInstanceOf(Map);
    expect(record).not.toBeInstanceOf(Set);
  });
});
