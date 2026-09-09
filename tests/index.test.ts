import { describe, expect, it } from 'vitest';
import { getStartupMessage } from '../src/index.js';

describe('getStartupMessage', () => {
  it('returns the expected startup message', () => {
    expect(getStartupMessage()).toBe('CIOS repository foundation is running.');
  });

  it('fails as expected when the message does not match', () => {
    expect(getStartupMessage()).not.toBe('this should not match');
  });
});
