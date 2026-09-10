import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ManifestParseError,
  parseManifestJson,
  validateDependencyPolicy,
  auditWorkspaceConsistency,
  resolvePackageDirectories,
  discoverWorkspacePackages,
} from '../check-architecture.mjs';

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

  it('H. rejects a forbidden dependency declared under optionalDependencies', () => {
    const packages = [
      {
        name: '@cios/domain',
        dependencies: ['@cios/infrastructure'],
        dependencyFields: {
          dependencies: [],
          devDependencies: [],
          optionalDependencies: ['@cios/infrastructure'],
          peerDependencies: [],
        },
      },
      { name: '@cios/infrastructure', dependencies: [] },
    ];
    const errors = validateDependencyPolicy(POLICY, packages);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/@cios\/domain.*@cios\/infrastructure/);
    expect(errors[0]).toMatch(/optionalDependencies/);
  });

  it('I. rejects a forbidden dependency declared under peerDependencies', () => {
    const packages = [
      {
        name: '@cios/web',
        dependencies: ['@cios/infrastructure'],
        dependencyFields: {
          dependencies: [],
          devDependencies: [],
          optionalDependencies: [],
          peerDependencies: ['@cios/infrastructure'],
        },
      },
      { name: '@cios/infrastructure', dependencies: [] },
    ];
    const errors = validateDependencyPolicy(POLICY, packages);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/@cios\/web.*@cios\/infrastructure/);
    expect(errors[0]).toMatch(/peerDependencies/);
  });

  it('J. accepts an allowed dependency declared in a permitted field (optionalDependencies)', () => {
    const packages = [
      {
        name: '@cios/application',
        dependencies: ['@cios/domain'],
        dependencyFields: {
          dependencies: [],
          devDependencies: [],
          optionalDependencies: ['@cios/domain'],
          peerDependencies: [],
        },
      },
      { name: '@cios/domain', dependencies: [] },
    ];
    expect(validateDependencyPolicy(POLICY, packages)).toEqual([]);
  });
});

describe('parseManifestJson', () => {
  it('parses valid JSON', () => {
    expect(parseManifestJson('{"name":"@cios/domain"}', '/fake/package.json')).toEqual({
      name: '@cios/domain',
    });
  });

  it('throws ManifestParseError (not a silent skip) on invalid JSON', () => {
    expect(() =>
      parseManifestJson('{ not valid json', '/fake/packages/broken/package.json'),
    ).toThrow(ManifestParseError);
    try {
      parseManifestJson('{ not valid json', '/fake/packages/broken/package.json');
      throw new Error('expected parseManifestJson to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(ManifestParseError);
      expect(error.manifestPath).toBe('/fake/packages/broken/package.json');
      expect(error.message).toMatch(/could not be parsed as valid JSON/);
      expect(error.message).toMatch(/\/fake\/packages\/broken\/package\.json/);
    }
  });
});

describe('auditWorkspaceConsistency', () => {
  it('K. fails when a policy package has no matching workspace package', () => {
    const policy = {
      packages: {
        '@cios/domain': { allowedDependencies: [] },
        '@cios/ghost': { allowedDependencies: [] },
      },
    };
    const packages = [{ name: '@cios/domain', dir: 'packages/domain', dependencies: [] }];
    const errors = auditWorkspaceConsistency(policy, packages);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/@cios\/ghost/);
    expect(errors[0]).toMatch(/no matching workspace package/);
  });

  it('L. fails when a workspace package is missing from the policy', () => {
    // auditWorkspaceConsistency intentionally delegates this case to
    // validateDependencyPolicy's "unknown workspace package" check rather
    // than duplicating it — verify that check still fires.
    const policy = { packages: { '@cios/domain': { allowedDependencies: [] } } };
    const packages = [
      { name: '@cios/domain', dir: 'packages/domain', dependencies: [] },
      { name: '@cios/undeclared', dir: 'packages/undeclared', dependencies: [] },
    ];
    expect(auditWorkspaceConsistency(policy, packages)).toEqual([]);
    const errors = validateDependencyPolicy(policy, packages);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/@cios\/undeclared/);
    expect(errors[0]).toMatch(/not declared in the dependency policy/);
  });

  it('M. fails on duplicate @cios/* workspace package names', () => {
    const policy = { packages: { '@cios/domain': { allowedDependencies: [] } } };
    const packages = [
      { name: '@cios/domain', dir: 'packages/domain', dependencies: [] },
      { name: '@cios/domain', dir: 'packages/domain-copy', dependencies: [] },
    ];
    const errors = auditWorkspaceConsistency(policy, packages);
    // Both the duplicate-name check and the policy-resolution check fire —
    // a duplicated name is inherently unresolvable to a single directory —
    // and each surfaces the ambiguity from its own angle.
    const duplicateError = errors.find((e) => e.includes('Duplicate @cios/* workspace package'));
    expect(duplicateError).toBeDefined();
    expect(duplicateError).toMatch(/"@cios\/domain"/);
    expect(duplicateError).toMatch(/packages\/domain/);
    expect(duplicateError).toMatch(/packages\/domain-copy/);
  });

  it('N. passes when policy and workspace are in sync', () => {
    const policy = {
      packages: {
        '@cios/domain': { allowedDependencies: [] },
        '@cios/application': { allowedDependencies: ['@cios/domain'] },
      },
    };
    const packages = [
      { name: '@cios/domain', dir: 'packages/domain', dependencies: [] },
      { name: '@cios/application', dir: 'packages/application', dependencies: ['@cios/domain'] },
    ];
    expect(auditWorkspaceConsistency(policy, packages)).toEqual([]);
  });
});

describe('resolvePackageDirectories', () => {
  it('O. resolves every policy package to its unique workspace directory', () => {
    const policy = {
      packages: {
        '@cios/domain': { allowedDependencies: [] },
        '@cios/application': { allowedDependencies: ['@cios/domain'] },
      },
    };
    const packages = [
      { name: '@cios/domain', dir: 'packages/domain', dependencies: [] },
      { name: '@cios/application', dir: 'packages/application', dependencies: ['@cios/domain'] },
    ];
    const { directories, errors } = resolvePackageDirectories(policy, packages);
    expect(errors).toEqual([]);
    expect(directories.get('@cios/domain')).toBe('packages/domain');
    expect(directories.get('@cios/application')).toBe('packages/application');
  });

  it('P. fails closed (returns no directories) when a policy package cannot be resolved', () => {
    const policy = {
      packages: {
        '@cios/domain': { allowedDependencies: [] },
        '@cios/ghost': { allowedDependencies: [] },
      },
    };
    const packages = [{ name: '@cios/domain', dir: 'packages/domain', dependencies: [] }];
    const { directories, errors } = resolvePackageDirectories(policy, packages);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0]).toMatch(/@cios\/ghost/);
    expect(directories.size).toBe(0);
  });
});

describe('discoverWorkspacePackages', () => {
  /** @type {string} */
  let workspaceRoot;

  function makePackage(dir, manifestContent) {
    const pkgDir = path.join(workspaceRoot, 'packages', dir);
    mkdirSync(pkgDir, { recursive: true });
    writeFileSync(path.join(pkgDir, 'package.json'), manifestContent, 'utf8');
  }

  function setup() {
    workspaceRoot = mkdtempSync(path.join(tmpdir(), 'cios-arch-check-'));
    mkdirSync(path.join(workspaceRoot, 'apps'), { recursive: true });
  }

  function teardown() {
    rmSync(workspaceRoot, { recursive: true, force: true });
  }

  it('Q. reports a malformed package.json as a manifestError, never as an absent package', () => {
    setup();
    try {
      makePackage('broken', '{ "name": "@cios/broken", invalid json');
      const { packages, manifestErrors } = discoverWorkspacePackages(workspaceRoot, [
        'apps',
        'packages',
      ]);
      expect(packages).toEqual([]);
      expect(manifestErrors).toHaveLength(1);
      expect(manifestErrors[0].manifestPath).toMatch(/broken[/\\]package\.json$/);
      expect(manifestErrors[0].message).toMatch(/could not be parsed as valid JSON/);
    } finally {
      teardown();
    }
  });

  it('R. inspects dependencies, devDependencies, optionalDependencies, and peerDependencies', () => {
    setup();
    try {
      makePackage(
        'multi-field',
        JSON.stringify({
          name: '@cios/multi-field',
          dependencies: { '@cios/domain': 'workspace:*' },
          devDependencies: { '@cios/testkit': 'workspace:*' },
          optionalDependencies: { '@cios/contracts': 'workspace:*' },
          peerDependencies: { '@cios/config': 'workspace:*' },
        }),
      );
      const { packages, manifestErrors } = discoverWorkspacePackages(workspaceRoot, [
        'apps',
        'packages',
      ]);
      expect(manifestErrors).toEqual([]);
      expect(packages).toHaveLength(1);
      const [pkg] = packages;
      expect(new Set(pkg.dependencies)).toEqual(
        new Set(['@cios/domain', '@cios/testkit', '@cios/contracts', '@cios/config']),
      );
      expect(pkg.dependencyFields.dependencies).toEqual(['@cios/domain']);
      expect(pkg.dependencyFields.devDependencies).toEqual(['@cios/testkit']);
      expect(pkg.dependencyFields.optionalDependencies).toEqual(['@cios/contracts']);
      expect(pkg.dependencyFields.peerDependencies).toEqual(['@cios/config']);
    } finally {
      teardown();
    }
  });

  it('S. a directory with no package.json is skipped, not reported as malformed', () => {
    setup();
    try {
      mkdirSync(path.join(workspaceRoot, 'packages', 'not-a-package'), { recursive: true });
      const { packages, manifestErrors } = discoverWorkspacePackages(workspaceRoot, [
        'apps',
        'packages',
      ]);
      expect(packages).toEqual([]);
      expect(manifestErrors).toEqual([]);
    } finally {
      teardown();
    }
  });
});
