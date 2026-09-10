import { describe, expect, it } from 'vitest';
import { createProvenanceRecord } from '../src/index.js';
import { generateUniverseId } from '@cios/domain';

describe('ProvenanceRecord: runtime immutability', () => {
  it('freezes the record and all of its nested collections/objects', () => {
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
      sources: [{ sourceKind: 'other', locator: 'note' }],
    });

    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.contributors)).toBe(true);
    for (const contributor of record.contributors) {
      expect(Object.isFrozen(contributor)).toBe(true);
    }
    expect(Object.isFrozen(record.parents)).toBe(true);
    for (const parentRef of record.parents) {
      expect(Object.isFrozen(parentRef)).toBe(true);
    }
    expect(Object.isFrozen(record.sources)).toBe(true);
    for (const source of record.sources) {
      expect(Object.isFrozen(source)).toBe(true);
    }
  });

  it('is isolated from later mutation of a caller-supplied contributors array/object', () => {
    const universeId = generateUniverseId();
    const mutableContributor: { contributorKind: 'creator' | 'ai'; contributorRef: string } = {
      contributorKind: 'creator',
      contributorRef: 'creator-1',
    };
    const contributors = [mutableContributor];

    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors,
    });

    contributors.push({ contributorKind: 'ai', contributorRef: 'model-1' });
    mutableContributor.contributorRef = 'mutated';

    expect(record.contributors).toHaveLength(1);
    expect(record.contributors[0]?.contributorRef).toBe('creator-1');
  });

  it('is isolated from later mutation of a caller-supplied parents array/object', () => {
    const universeId = generateUniverseId();
    const parent = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });
    const mutableParentRef = { universeId, provenanceId: parent.provenanceId };
    const parents = [mutableParentRef];

    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'ai-suggestion',
      contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
      parents,
    });

    parents.push({ universeId, provenanceId: parent.provenanceId });
    mutableParentRef.provenanceId = 'ffffffff-ffff-4fff-8fff-ffffffffffff' as never;

    expect(record.parents).toHaveLength(1);
    expect(record.parents[0]?.provenanceId).toBe(parent.provenanceId);
  });

  it('is isolated from later mutation of a caller-supplied sources array/object', () => {
    const universeId = generateUniverseId();
    const mutableSource: { sourceKind: 'file' | 'url' | 'publication' | 'other'; locator: string } =
      { sourceKind: 'file', locator: '/notes.pdf' };
    const sources = [mutableSource];

    const record = createProvenanceRecord({
      universeId,
      provenanceType: 'imported-reference',
      sources,
    });

    sources.push({ sourceKind: 'other', locator: 'more notes' });
    mutableSource.locator = '/mutated.pdf';

    expect(record.sources).toHaveLength(1);
    expect(record.sources[0]?.locator).toBe('/notes.pdf');
  });
});
