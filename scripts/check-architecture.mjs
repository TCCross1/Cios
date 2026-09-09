#!/usr/bin/env node
/**
 * Validates workspace package.json manifests against the machine-readable
 * CIOS internal dependency policy (docs/architecture/dependency-policy.json).
 *
 * This is the "package-manifest dependency policy" gate referenced by
 * `pnpm arch:check` and the Constitution (section U, Dependency Direction).
 * Source-level import boundaries are enforced separately by ESLint
 * (`no-restricted-imports` overrides in eslint.config.js).
 *
 * The validation logic (`validateDependencyPolicy`) is exported so it can be
 * exercised directly against in-memory fixtures in
 * scripts/tests/check-architecture.test.mjs, without touching real
 * package.json files.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const CIOS_PREFIX = '@cios/';

/**
 * @typedef {{ name: string, dependencies: string[] }} WorkspacePackage
 * @typedef {{ packages: Record<string, { allowedDependencies: string[] }> }} DependencyPolicy
 */

/**
 * Validate a set of workspace packages (name + declared @cios/* dependency
 * names) against a dependency policy. Pure function — operates only on the
 * data passed in, does not touch the filesystem.
 *
 * @param {DependencyPolicy} policy
 * @param {WorkspacePackage[]} packages
 * @returns {string[]} human-readable violation messages; empty when valid
 */
export function validateDependencyPolicy(policy, packages) {
  /** @type {string[]} */
  const errors = [];
  const knownNames = new Set(Object.keys(policy.packages));
  /** @type {Map<string, string[]>} */
  const graph = new Map();

  for (const pkg of packages) {
    if (!knownNames.has(pkg.name)) {
      errors.push(
        `Unknown @cios/* workspace package "${pkg.name}" is not declared in the dependency policy. ` +
          `Add it to docs/architecture/dependency-policy.json before it can declare internal dependencies.`,
      );
      continue;
    }

    const allowed = new Set(policy.packages[pkg.name].allowedDependencies);
    /** @type {string[]} */
    const edges = [];

    for (const dep of pkg.dependencies) {
      if (!knownNames.has(dep)) {
        errors.push(
          `Package "${pkg.name}" declares a dependency on unknown package "${dep}", ` +
            `which is not present in the dependency policy.`,
        );
        continue;
      }

      if (!allowed.has(dep)) {
        errors.push(
          `Unauthorized dependency: "${pkg.name}" -> "${dep}" is not permitted by the dependency policy ` +
            `(allowed: ${policy.packages[pkg.name].allowedDependencies.join(', ') || '(none)'}).`,
        );
        continue;
      }

      edges.push(dep);
    }

    graph.set(pkg.name, edges);
  }

  const cycle = findCycle(graph);
  if (cycle) {
    errors.push(`Circular internal dependency detected: ${cycle.join(' -> ')}.`);
  }

  return errors;
}

/**
 * Depth-first cycle detection over the declared (post-filter) dependency
 * graph. Returns the first cycle found as an ordered array of package names,
 * or null if the graph is acyclic.
 *
 * @param {Map<string, string[]>} graph
 * @returns {string[] | null}
 */
function findCycle(graph) {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  /** @type {Map<string, number>} */
  const color = new Map();
  for (const node of graph.keys()) {
    color.set(node, WHITE);
  }

  /** @type {string[]} */
  const stack = [];

  function visit(node) {
    color.set(node, GRAY);
    stack.push(node);

    for (const next of graph.get(node) ?? []) {
      const state = color.get(next);
      if (state === GRAY) {
        const cycleStart = stack.indexOf(next);
        return [...stack.slice(cycleStart), next];
      }
      if (state === WHITE) {
        const found = visit(next);
        if (found) {
          return found;
        }
      }
    }

    stack.pop();
    color.set(node, BLACK);
    return null;
  }

  for (const node of graph.keys()) {
    if (color.get(node) === WHITE) {
      const found = visit(node);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

/**
 * Reads dependency policy JSON from disk.
 *
 * @param {string} policyPath
 * @returns {DependencyPolicy}
 */
export function loadPolicy(policyPath) {
  return JSON.parse(readFileSync(policyPath, 'utf8'));
}

/**
 * Discovers workspace package.json files under the given root directories
 * (one level deep, e.g. apps/* and packages/*) and extracts each package's
 * name plus its declared @cios/* dependencies (from both `dependencies` and
 * `devDependencies`).
 *
 * @param {string} repoRoot
 * @param {string[]} workspaceGlobDirs directory names relative to repoRoot, e.g. ['apps', 'packages']
 * @returns {WorkspacePackage[]}
 */
export function discoverWorkspacePackages(repoRoot, workspaceGlobDirs) {
  /** @type {WorkspacePackage[]} */
  const result = [];

  for (const dir of workspaceGlobDirs) {
    const groupPath = path.join(repoRoot, dir);
    let entries;
    try {
      entries = readdirSync(groupPath);
    } catch {
      continue;
    }

    for (const entry of entries) {
      const pkgDir = path.join(groupPath, entry);
      if (!statSync(pkgDir).isDirectory()) {
        continue;
      }

      const manifestPath = path.join(pkgDir, 'package.json');
      let manifest;
      try {
        manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      } catch {
        continue;
      }

      const dependencyNames = new Set([
        ...Object.keys(manifest.dependencies ?? {}),
        ...Object.keys(manifest.devDependencies ?? {}),
      ]);

      result.push({
        name: manifest.name,
        dependencies: [...dependencyNames].filter((name) => name.startsWith(CIOS_PREFIX)),
      });
    }
  }

  return result;
}

function main() {
  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
  const policyPath = path.join(repoRoot, 'docs', 'architecture', 'dependency-policy.json');
  const policy = loadPolicy(policyPath);
  const packages = discoverWorkspacePackages(repoRoot, ['apps', 'packages']);

  const errors = validateDependencyPolicy(policy, packages);

  if (errors.length > 0) {
    console.error(`Architecture check FAILED — ${errors.length} violation(s):\n`);
    for (const error of errors) {
      console.error(`  ✗ ${error}`);
    }
    console.error(
      '\nSee docs/architecture/dependency-policy.json and docs/architecture/CONSTITUTION.md ' +
        '(section U, Dependency Direction) for the authoritative dependency rules. Do not weaken ' +
        'the policy to make this pass — report the conflict instead.',
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Architecture check passed — ${packages.length} workspace package(s) satisfy the dependency policy.`,
  );
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  main();
}
