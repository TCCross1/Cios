import { describe, expect, it } from 'vitest';
import {
  createFaction,
  createEntityScope,
  generateUniverseId,
  DomainValidationError,
} from '../src/index.js';
import * as domain from '../src/index.js';

const scope = createEntityScope({ kind: 'universe', universeId: generateUniverseId() });

describe('Faction (chosen model: no separate Organization kind)', () => {
  it('constructs a valid faction', () => {
    const faction = createFaction({ scope, name: 'The Quiet Order' });
    expect(faction.name).toBe('The Quiet Order');
    expect(faction.entityKind).toBe('faction');
    expect(faction.displayName).toBe('The Quiet Order');
  });

  it('rejects an empty name', () => {
    expect(() => createFaction({ scope, name: '' })).toThrow(DomainValidationError);
  });

  it('rejects a whitespace-only name', () => {
    expect(() => createFaction({ scope, name: '   ' })).toThrow(DomainValidationError);
  });

  it('represents an ordinary/mundane organization without a separate Organization kind', () => {
    // Directive 003 deliberately defers a distinct `Organization` kind
    // (see faction.ts docstring). An everyday organization is modeled as
    // a Faction, proving no fake Organization type/implementation exists
    // anywhere in the public API (see also tests/entity-scope-and-ref.test.ts
    // `isEntityKind`, which confirms "organization" is not a supported kind).
    const bakersGuild = createFaction({ scope, name: "The Riverside Bakers' Guild" });
    expect(bakersGuild.entityKind).toBe('faction');
  });

  it('does not export any Organization construction API (Organization is deferred)', () => {
    expect('createOrganization' in domain).toBe(false);
  });

  it('is frozen at runtime: direct mutation does not change the constructed value', () => {
    const faction = createFaction({ scope, name: 'The Quiet Order' });
    expect(Object.isFrozen(faction)).toBe(true);
    expect(() => {
      // @ts-expect-error Faction.name is readonly at compile time too
      faction.name = 'Mutated';
    }).toThrow(TypeError);
    expect(faction.name).toBe('The Quiet Order');
  });
});
