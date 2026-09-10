import { describe, expect, it } from 'vitest';
import {
  createConcept,
  createEntityScope,
  generateUniverseId,
  DomainValidationError,
} from '../src/index.js';

const scope = createEntityScope({ kind: 'universe', universeId: generateUniverseId() });

describe('Concept', () => {
  it('constructs a valid concept', () => {
    const concept = createConcept({ scope, name: 'The Binding Oath' });
    expect(concept.name).toBe('The Binding Oath');
    expect(concept.entityKind).toBe('concept');
    expect(concept.displayName).toBe('The Binding Oath');
  });

  it('rejects an empty name', () => {
    expect(() => createConcept({ scope, name: '' })).toThrow(DomainValidationError);
  });

  it('rejects a whitespace-only name', () => {
    expect(() => createConcept({ scope, name: '   ' })).toThrow(DomainValidationError);
  });
});
