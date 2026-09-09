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
    expect(faction.kind).toBe('faction');
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
    expect(bakersGuild.kind).toBe('faction');
  });

  it('does not export any Organization construction API (Organization is deferred)', () => {
    expect('createOrganization' in domain).toBe(false);
  });
});
