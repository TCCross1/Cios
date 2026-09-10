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
    expect(rule.entityKind).toBe('rule');
    expect(rule.displayName).toBe('Magic cannot resurrect the dead');
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
    // Only identity (entityId/universeId/entityKind/scope/displayName),
    // state (lifecycleState/createdAt/updatedAt), and content
    // (name/description) fields exist — no `canon`, `isCanon`,
    // `authority`, or similar field is present anywhere on a Rule.
    expect(keys).toEqual([
      'createdAt',
      'displayName',
      'entityId',
      'entityKind',
      'lifecycleState',
      'name',
      'scope',
      'universeId',
      'updatedAt',
    ]);
    expect(rule).not.toHaveProperty('canon');
    expect(rule).not.toHaveProperty('isCanon');
    expect(rule).not.toHaveProperty('authority');
    expect(rule.lifecycleState).toBe('draft');
  });
});
