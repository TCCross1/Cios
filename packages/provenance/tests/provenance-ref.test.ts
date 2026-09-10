import { describe, expect, it } from 'vitest';
import { createProvenanceRef, generateProvenanceId, type ProvenanceId } from '../src/index.js';
import { generateUniverseId, DomainValidationError, type UniverseId } from '@cios/domain';

describe('ProvenanceRef', () => {
  it('accepts a valid ProvenanceRef', () => {
    const universeId = generateUniverseId();
    const provenanceId = generateProvenanceId();
    const ref = createProvenanceRef({ universeId, provenanceId });
    expect(ref).toEqual({ universeId, provenanceId });
  });

  it('rejects a malformed ProvenanceId', () => {
    const universeId = generateUniverseId();
    expect(() => createProvenanceRef({ universeId, provenanceId: 'bad' as ProvenanceId })).toThrow(
      DomainValidationError,
    );
  });

  it('rejects a malformed UniverseId', () => {
    const provenanceId = generateProvenanceId();
    expect(() => createProvenanceRef({ universeId: 'bad' as UniverseId, provenanceId })).toThrow(
      DomainValidationError,
    );
  });

  it('is frozen at runtime: cannot be mutated after creation', () => {
    const universeId = generateUniverseId();
    const provenanceId = generateProvenanceId();
    const ref = createProvenanceRef({ universeId, provenanceId });
    expect(Object.isFrozen(ref)).toBe(true);
    expect(() => {
      // @ts-expect-error ProvenanceRef.provenanceId is readonly at compile time too
      ref.provenanceId = generateProvenanceId();
    }).toThrow(TypeError);
    expect(ref.provenanceId).toBe(provenanceId);
  });

  it('serializes to a stable plain-data shape', () => {
    const universeId = generateUniverseId();
    const provenanceId = generateProvenanceId();
    const ref = createProvenanceRef({ universeId, provenanceId });
    const roundTripped = JSON.parse(JSON.stringify(ref));
    expect(roundTripped).toEqual({ universeId, provenanceId });
  });

  it('does not expose an entityId, workId, sparkId, subject type, or Canon state', () => {
    const universeId = generateUniverseId();
    const provenanceId = generateProvenanceId();
    const ref = createProvenanceRef({ universeId, provenanceId });
    expect(Object.keys(ref).sort()).toEqual(['provenanceId', 'universeId']);
  });

  it('branded types are not compile-time interchangeable (see provenance-id.test.ts for the @ts-expect-error assertions)', () => {
    // At runtime, ProvenanceId and UniverseId are both plain UUID v4
    // strings, so no runtime rejection is possible here purely from
    // swapping well-formed values — the brand is a compile-time-only
    // guarantee. Compile-time non-interchangeability is proven in
    // `provenance-id.test.ts`.
    const universeId = generateUniverseId();
    const provenanceId = generateProvenanceId();
    expect(universeId).not.toBe(provenanceId);
  });
});
