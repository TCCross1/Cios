import { describe, expect, it } from 'vitest';
import {
  createProvenanceId,
  createProvenanceContributorRef,
  createProvenanceRecord,
} from '../src/index.js';
import { generateUniverseId, DomainValidationError } from '@cios/domain';

function codeOf(fn: () => unknown): string {
  try {
    fn();
  } catch (error) {
    if (error instanceof DomainValidationError) {
      return error.code;
    }
    throw error;
  }
  throw new Error('expected function to throw a DomainValidationError');
}

describe('ProvenanceRecord: deterministic error codes', () => {
  it('malformed ProvenanceId', () => {
    expect(codeOf(() => createProvenanceId('not-a-uuid'))).toBe('provenance_id.malformed');
  });

  it('empty contributor ref', () => {
    expect(
      codeOf(() =>
        createProvenanceContributorRef({ contributorKind: 'creator', contributorRef: '' }),
      ),
    ).toMatch(/^provenance_contributor\./);
  });

  it('missing creator contributor', () => {
    const universeId = generateUniverseId();
    expect(
      codeOf(() =>
        createProvenanceRecord({
          universeId,
          provenanceType: 'creator-original',
          contributors: [],
        }),
      ),
    ).toBe('provenance_record.missing_creator_contributor');
  });

  it('forbidden AI contributor', () => {
    const universeId = generateUniverseId();
    expect(
      codeOf(() =>
        createProvenanceRecord({
          universeId,
          provenanceType: 'creator-original',
          contributors: [
            { contributorKind: 'creator', contributorRef: 'creator-1' },
            { contributorKind: 'ai', contributorRef: 'model-1' },
          ],
        }),
      ),
    ).toBe('provenance_record.forbidden_ai_contributor');
  });

  it('missing AI contributor', () => {
    const universeId = generateUniverseId();
    expect(
      codeOf(() =>
        createProvenanceRecord({ universeId, provenanceType: 'ai-suggestion', contributors: [] }),
      ),
    ).toBe('provenance_record.missing_ai_contributor');
  });

  it('hybrid contributor deficiency', () => {
    const universeId = generateUniverseId();
    expect(
      codeOf(() =>
        createProvenanceRecord({
          universeId,
          provenanceType: 'hybrid',
          contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
        }),
      ),
    ).toBe('provenance_record.hybrid_contributor_deficiency');
  });

  it('imported source required', () => {
    const universeId = generateUniverseId();
    expect(
      codeOf(() =>
        createProvenanceRecord({ universeId, provenanceType: 'imported-reference', sources: [] }),
      ),
    ).toBe('provenance_record.imported_source_required');
  });

  it('derivation parent required', () => {
    const universeId = generateUniverseId();
    expect(
      codeOf(() =>
        createProvenanceRecord({
          universeId,
          provenanceType: 'ai-interpretation',
          contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
        }),
      ),
    ).toBe('provenance_record.derivation_parent_required');
  });

  it('cross-universe parent', () => {
    const universeId = generateUniverseId();
    const otherUniverseId = generateUniverseId();
    const parent = createProvenanceRecord({
      universeId: otherUniverseId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });
    expect(
      codeOf(() =>
        createProvenanceRecord({
          universeId,
          provenanceType: 'ai-suggestion',
          contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
          parents: [{ universeId: otherUniverseId, provenanceId: parent.provenanceId }],
        }),
      ),
    ).toBe('provenance_record.parent_cross_universe');
  });

  it('self-parent', () => {
    const universeId = generateUniverseId();
    const selfId = '11111111-1111-4111-8111-111111111111';
    expect(
      codeOf(() =>
        createProvenanceRecord({
          universeId,
          provenanceId: selfId as never,
          provenanceType: 'ai-suggestion',
          contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
          parents: [{ universeId, provenanceId: selfId as never }],
        }),
      ),
    ).toBe('provenance_record.parent_self');
  });

  it('duplicate parent', () => {
    const universeId = generateUniverseId();
    const parent = createProvenanceRecord({
      universeId,
      provenanceType: 'creator-original',
      contributors: [{ contributorKind: 'creator', contributorRef: 'creator-1' }],
    });
    expect(
      codeOf(() =>
        createProvenanceRecord({
          universeId,
          provenanceType: 'ai-suggestion',
          contributors: [{ contributorKind: 'ai', contributorRef: 'model-1' }],
          parents: [
            { universeId, provenanceId: parent.provenanceId },
            { universeId, provenanceId: parent.provenanceId },
          ],
        }),
      ),
    ).toBe('provenance_record.parent_duplicate');
  });

  it('duplicate contributor', () => {
    const universeId = generateUniverseId();
    expect(
      codeOf(() =>
        createProvenanceRecord({
          universeId,
          provenanceType: 'creator-original',
          contributors: [
            { contributorKind: 'creator', contributorRef: 'creator-1' },
            { contributorKind: 'creator', contributorRef: 'creator-1' },
          ],
        }),
      ),
    ).toBe('provenance_record.duplicate_contributor');
  });

  it('duplicate source', () => {
    const universeId = generateUniverseId();
    expect(
      codeOf(() =>
        createProvenanceRecord({
          universeId,
          provenanceType: 'imported-reference',
          sources: [
            { sourceKind: 'file', locator: '/x.pdf' },
            { sourceKind: 'file', locator: '/x.pdf' },
          ],
        }),
      ),
    ).toBe('provenance_record.duplicate_source');
  });
});
