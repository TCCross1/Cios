import { describe, expect, it } from 'vitest';
import { validateDependencyPolicy } from '../check-architecture.mjs';

/**
 * Mirrors docs/architecture/dependency-policy.json. Kept as an inline
 * fixture (rather than importing the live policy) so these tests remain
 * meaningful even if the real policy file is edited, and so a broken policy
 * file cannot silently disable this suite.
 */
const POLICY = {
  packages: {
    '@cios/domain': { allowedDependencies: [] },
    '@cios/contracts': { allowedDependencies: [] },
    '@cios/config': { allowedDependencies: [] },
    '@cios/testkit': { allowedDependencies: [] },
    '@cios/creative-graph': { allowedDependencies: ['@cios/domain'] },
    '@cios/provenance': { allowedDependencies: ['@cios/domain'] },
    '@cios/agent-runtime': { allowedDependencies: ['@cios/contracts'] },
    '@cios/application': {
      allowedDependencies: [
        '@cios/domain',
        '@cios/contracts',
        '@cios/creative-graph',
        '@cios/provenance',
      ],
    },
    '@cios/infrastructure': {
      allowedDependencies: ['@cios/domain', '@cios/application', '@cios/contracts', '@cios/config'],
    },
    '@cios/api': {
      allowedDependencies: [
        '@cios/application',
        '@cios/infrastructure',
        '@cios/contracts',
        '@cios/config',
      ],
    },
    '@cios/worker': {
      allowedDependencies: [
        '@cios/application',
        '@cios/infrastructure',
        '@cios/agent-runtime',
        '@cios/contracts',
        '@cios/config',
      ],
    },
    '@cios/web': { allowedDependencies: ['@cios/contracts'] },
  },
};

/** The current, valid, real dependency graph — used for the "positive" test. */
const VALID_GRAPH = [
  { name: '@cios/domain', dependencies: [] },
  { name: '@cios/contracts', dependencies: [] },
  { name: '@cios/config', dependencies: [] },
  { name: '@cios/testkit', dependencies: [] },
  { name: '@cios/creative-graph', dependencies: ['@cios/domain'] },
  { name: '@cios/provenance', dependencies: ['@cios/domain'] },
  { name: '@cios/agent-runtime', dependencies: ['@cios/contracts'] },
  {
    name: '@cios/application',
    dependencies: ['@cios/domain', '@cios/contracts', '@cios/creative-graph', '@cios/provenance'],
  },
  {
    name: '@cios/infrastructure',
    dependencies: ['@cios/domain', '@cios/application', '@cios/contracts', '@cios/config'],
  },
  {
    name: '@cios/api',
    dependencies: ['@cios/application', '@cios/infrastructure', '@cios/contracts', '@cios/config'],
  },
  {
    name: '@cios/worker',
    dependencies: [
      '@cios/application',
      '@cios/infrastructure',
      '@cios/agent-runtime',
      '@cios/contracts',
      '@cios/config',
    ],
  },
  { name: '@cios/web', dependencies: ['@cios/contracts'] },
];

describe('validateDependencyPolicy', () => {
  it('A. accepts the current, valid dependency graph', () => {
    expect(validateDependencyPolicy(POLICY, VALID_GRAPH)).toEqual([]);
  });

  it('B. rejects domain -> infrastructure', () => {
    const packages = [
      { name: '@cios/domain', dependencies: ['@cios/infrastructure'] },
      { name: '@cios/infrastructure', dependencies: [] },
    ];
    const errors = validateDependencyPolicy(POLICY, packages);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/@cios\/domain.*@cios\/infrastructure/);
  });

  it('C. rejects application -> infrastructure', () => {
    const packages = [
      { name: '@cios/application', dependencies: ['@cios/domain', '@cios/infrastructure'] },
      { name: '@cios/infrastructure', dependencies: [] },
      { name: '@cios/domain', dependencies: [] },
    ];
    const errors = validateDependencyPolicy(POLICY, packages);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/@cios\/application.*@cios\/infrastructure/);
  });

  it('D. rejects web -> infrastructure', () => {
    const packages = [
      { name: '@cios/web', dependencies: ['@cios/infrastructure'] },
      { name: '@cios/infrastructure', dependencies: [] },
    ];
    const errors = validateDependencyPolicy(POLICY, packages);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/@cios\/web.*@cios\/infrastructure/);
  });

  it('E. rejects creative-graph -> application', () => {
    const packages = [
      { name: '@cios/creative-graph', dependencies: ['@cios/domain', '@cios/application'] },
      { name: '@cios/application', dependencies: [] },
      { name: '@cios/domain', dependencies: [] },
    ];
    const errors = validateDependencyPolicy(POLICY, packages);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/@cios\/creative-graph.*@cios\/application/);
  });

  it('F. rejects an unknown @cios/* dependency', () => {
    const packages = [{ name: '@cios/domain', dependencies: ['@cios/does-not-exist'] }];
    const errors = validateDependencyPolicy(POLICY, packages);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/unknown package "@cios\/does-not-exist"/);
  });

  it('F2. rejects an unknown @cios/* package as the subject of the graph', () => {
    const packages = [{ name: '@cios/not-a-real-package', dependencies: [] }];
    const errors = validateDependencyPolicy(POLICY, packages);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Unknown @cios\/\* workspace package "@cios\/not-a-real-package"/);
  });

  it('G. rejects a cycle introduced into an otherwise-authorized graph', () => {
    // Both edges are individually authorized by the policy fixture below,
    // but together they form a cycle, which must be rejected independently
    // of per-edge authorization.
    const cyclicPolicy = {
      packages: {
        '@cios/domain': { allowedDependencies: ['@cios/contracts'] },
        '@cios/contracts': { allowedDependencies: ['@cios/domain'] },
      },
    };
    const packages = [
      { name: '@cios/domain', dependencies: ['@cios/contracts'] },
      { name: '@cios/contracts', dependencies: ['@cios/domain'] },
    ];
    const errors = validateDependencyPolicy(cyclicPolicy, packages);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/Circular internal dependency detected/);
  });
});
