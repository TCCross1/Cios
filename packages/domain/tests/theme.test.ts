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
});
