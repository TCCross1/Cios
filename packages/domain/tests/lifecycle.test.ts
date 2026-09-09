import { describe, expect, it } from 'vitest';
import {
  isLifecycleState,
  resolveLifecycleState,
  DomainValidationError,
  type LifecycleState,
} from '../src/index.js';

describe('LifecycleState', () => {
  it('accepts every supported lifecycle state', () => {
    expect(isLifecycleState('draft')).toBe(true);
    expect(isLifecycleState('active')).toBe(true);
    expect(isLifecycleState('archived')).toBe(true);
  });

  it('rejects an unsupported lifecycle state at the runtime validation boundary', () => {
    expect(isLifecycleState('canon')).toBe(false);
    expect(() => resolveLifecycleState('canon' as LifecycleState)).toThrow(DomainValidationError);
  });

  it('defaults to "draft" when omitted', () => {
    expect(resolveLifecycleState(undefined)).toBe('draft');
  });

  it('never accepts a Canon-authority value as an ordinary lifecycle state', () => {
    const canonLikeValues = [
      'raw_inspiration',
      'candidate',
      'developing',
      'canon',
      'locked_canon',
      'alternate',
      'deprecated',
      'rejected',
    ];
    for (const value of canonLikeValues) {
      expect(isLifecycleState(value)).toBe(false);
    }
  });
});
