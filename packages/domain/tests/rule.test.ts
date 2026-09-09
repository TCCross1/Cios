import { describe, expect, it } from 'vitest';
import {
  createRule,
  createEntityScope,
  generateUniverseId,
  DomainValidationError,
} from '../src/index.js';

const scope = createEntityScope({ kind: 'universe', universeId: generateUniverseId() });

describe('Rule', () => {
  it('constructs a valid rule', () => {
    const rule = createRule({ scope, name: 'Magic cannot resurrect the dead' });
    expect(rule.name).toBe('Magic cannot resurrect the dead');
    expect(rule.kind).toBe('rule');
  });

  it('rejects an empty name', () => {
    expect(() => createRule({ scope, name: '' })).toThrow(DomainValidationError);
  });

  it('rejects a whitespace-only name', () => {
    expect(() => createRule({ scope, name: '   ' })).toThrow(DomainValidationError);
  });

  it('has no Canon-authority field or state — Rule existence alone does not imply Canon', () => {
    const rule = createRule({ scope, name: 'Time travel only moves forward' });
    const keys = Object.keys(rule).sort();
    // Only identity (id/kind/scope), state (lifecycle), and content
    // (name/description) fields exist — no `canon`, `isCanon`,
    // `authority`, or similar field is present anywhere on a Rule.
    expect(keys).toEqual(['id', 'kind', 'lifecycle', 'name', 'scope']);
    expect(rule).not.toHaveProperty('canon');
    expect(rule).not.toHaveProperty('isCanon');
    expect(rule).not.toHaveProperty('authority');
    expect(rule.lifecycle).toBe('draft');
  });
});
