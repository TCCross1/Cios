import { describe, expect, it } from 'vitest';
import {
  createTheme,
  createEntityScope,
  generateUniverseId,
  DomainValidationError,
} from '../src/index.js';

const scope = createEntityScope({ kind: 'universe', universeId: generateUniverseId() });

describe('Theme', () => {
  it('constructs a valid theme', () => {
    const theme = createTheme({ scope, name: 'Found Family' });
    expect(theme.name).toBe('Found Family');
    expect(theme.entityKind).toBe('theme');
    expect(theme.displayName).toBe('Found Family');
  });

  it('rejects an empty name', () => {
    expect(() => createTheme({ scope, name: '' })).toThrow(DomainValidationError);
  });

  it('rejects a whitespace-only name', () => {
    expect(() => createTheme({ scope, name: '\t\n' })).toThrow(DomainValidationError);
  });

  it('is frozen at runtime: direct mutation does not change the constructed value', () => {
    const theme = createTheme({ scope, name: 'Found Family' });
    expect(Object.isFrozen(theme)).toBe(true);
    expect(() => {
      // @ts-expect-error Theme.name is readonly at compile time too
      theme.name = 'Mutated';
    }).toThrow(TypeError);
    expect(theme.name).toBe('Found Family');
  });
});
