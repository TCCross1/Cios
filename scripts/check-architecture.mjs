#!/usr/bin/env node
/**
 * Validates workspace package.json manifests against the machine-readable
 * CIOS internal dependency policy (docs/architecture/dependency-policy.json).
 *
 * This is the "package-manifest dependency policy" gate referenced by
 * `pnpm arch:check` and the Constitution (section U, Dependency Direction).
 * Source-level import boundaries are enforced separately by ESLint
 * (`no-restricted-imports` overrides in eslint.config.js), which derives its
 * per-package source directories from `resolvePackageDirectories` below
 * rather than a second, manually maintained map — so there is exactly one
 * place (this file + dependency-policy.json) that can drift.
 *
 * Directive 002R2 fail-closed guarantees enforced here:
 *   - a malformed (unparseable) package.json is a hard failure, never a
 *     silently-skipped/absent package;
 *   - internal @cios/* references are inspected in `dependencies`,
 *     `devDependencies`, `optionalDependencies`, and `peerDependencies`
 *     alike (see the comment on DEPENDENCY_FIELDS for why no field is
 *     treated as harmless);
 *   - policy and workspace membership must be mutually consistent (every
 *     workspace @cios/* package is declared in the policy, every policy
 *     package resolves to exactly one workspace directory, and no two
 *     workspace packages share a name).
 *
 * The validation logic is exported so it can be exercised directly against
 * in-memory fixtures in scripts/tests/check-architecture.test.mjs, without
 * touching real package.json files.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const CIOS_PREFIX = '@cios/';

/**
 * Manifest fields inspected for internal @cios/* references. All four are
 * treated identically and none is presumed architecturally harmless:
 *   - `dependencies` / `devDependencies` can both be imported from source.
 *   - `optionalDependencies` are still resolved and importable at
 *     runtime/build time when present, so an unauthorized internal coupling
 *     declared there is just as real as in `dependencies`.
 *   - `peerDependencies` express a required architectural relationship the
 *     *consumer* must satisfy, so a peer on a forbidden internal package is
 *     still an architecture-direction violation, not merely metadata.
 * If a future need arises to treat a field differently, that must be an
 * explicit, documented policy decision — not a silent omission.
 */
const DEPENDENCY_FIELDS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
];

/**
 * @typedef {{ name: string, dir: string, manifestPath: string, dependencies: string[], dependencyFields: Record<string, string[]> }} WorkspacePackage
 * @typedef {{ manifestPath: string, message: string }} ManifestError
 * @typedef {{ packages: Record<string, { allowedDependencies: string[] }> }} DependencyPolicy
 */

/**
 * Thrown when a discovered package.json cannot be parsed as JSON. Carries
 * the manifest path so callers can report exactly which file is malformed.
 */
export class ManifestParseError extends Error {
  constructor(manifestPath, cause) {
    super(`Manifest could not be parsed as valid JSON: ${manifestPath}`);
    this.name = 'ManifestParseError';
    this.manifestPath = manifestPath;
    this.cause = cause;
  }
}

/**
 * Parses raw package.json text, throwing ManifestParseError (never
 * returning a placeholder or "absent" value) on invalid JSON. Pure/in-memory
 * so it can be unit-tested without touching the filesystem.
 *
 * @param {string} rawContent
 * @param {string} manifestPath used only to produce an actionable error
 * @returns {Record<string, unknown>}
 */
export function parseManifestJson(rawContent, manifestPath) {
  try {
    return JSON.parse(rawContent);
  } catch (cause) {
    throw new ManifestParseError(manifestPath, cause);
  }
}

/**
 * Validate a set of workspace packages (name + declared @cios/* dependency
 * names, optionally broken down per manifest field) against a dependency
 * policy. Pure function — operates only on the data passed in, does not
 * touch the filesystem.
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
      const fields = fieldsDeclaring(pkg, dep);
      const fieldSuffix = fields.length > 0 ? ` (declared in: ${fields.join(', ')})` : '';

      if (!knownNames.has(dep)) {
        errors.push(
          `Package "${pkg.name}" declares a dependency on unknown package "${dep}"${fieldSuffix}, ` +
            `which is not present in the dependency policy.`,
        );
        continue;
      }

      if (!allowed.has(dep)) {
        errors.push(
          `Unauthorized dependency: "${pkg.name}" -> "${dep}"${fieldSuffix} is not permitted by the ` +
            `dependency policy (allowed: ${policy.packages[pkg.name].allowedDependencies.join(', ') || '(none)'}). ` +
            `See docs/architecture/CONSTITUTION.md (section U, Dependency Direction).`,
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
 * Returns which of a package's declared manifest fields (if tracked via
 * `dependencyFields`) list the given dependency name — used only to enrich
 * error messages. Returns [] when field-level detail wasn't supplied.
 *
 * @param {WorkspacePackage} pkg
 * @param {string} dep
 * @returns {string[]}
 */
function fieldsDeclaring(pkg, dep) {
  if (!pkg.dependencyFields) {
    return [];
  }
  return DEPENDENCY_FIELDS.filter((field) => (pkg.dependencyFields[field] ?? []).includes(dep));
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
 * Checks that policy declarations and actual workspace membership are
 * mutually consistent. Pure function — in-memory, fs-free, unit-testable.
 *
 * Fails closed on:
 *   A. a workspace @cios/* package missing from the policy (delegated to
 *      validateDependencyPolicy's "unknown workspace package" check, not
 *      duplicated here);
 *   B. a policy package with no matching workspace package;
 *   C. a policy package that cannot be resolved to exactly one workspace
 *      source directory (folded into B/D — "no match" or "ambiguous match"
 *      are the only two ways resolution can fail);
 *   D. duplicate @cios/* workspace package names.
 *
 * @param {DependencyPolicy} policy
 * @param {WorkspacePackage[]} packages
 * @returns {string[]}
 */
export function auditWorkspaceConsistency(policy, packages) {
  /** @type {string[]} */
  const errors = [];

  /** @type {Map<string, WorkspacePackage[]>} */
  const byName = new Map();
  for (const pkg of packages) {
    const existing = byName.get(pkg.name) ?? [];
    existing.push(pkg);
    byName.set(pkg.name, existing);
  }

  for (const [name, matches] of byName) {
    if (matches.length > 1) {
      const dirs = matches.map((m) => m.dir).join(', ');
      errors.push(
        `Duplicate @cios/* workspace package name "${name}" found in multiple directories: ${dirs}. ` +
          `Each package name must resolve to exactly one workspace package/source directory.`,
      );
    }
  }

  for (const policyName of Object.keys(policy.packages)) {
    const matches = byName.get(policyName) ?? [];
    if (matches.length === 0) {
      errors.push(
        `Policy package "${policyName}" (docs/architecture/dependency-policy.json) has no matching ` +
          `workspace package under apps/* or packages/*. Every policy-controlled package must resolve ` +
          `to exactly one workspace source directory — add the missing workspace package or remove it ` +
          `from the policy.`,
      );
    } else if (matches.length > 1) {
      errors.push(
        `Policy package "${policyName}" cannot be resolved to a single source directory: it matches ` +
          `${matches.length} workspace directories (${matches.map((m) => m.dir).join(', ')}).`,
      );
    }
  }

  return errors;
}

/**
 * Resolves each policy-controlled package name to its unique workspace
 * source directory. Used by eslint.config.js to generate per-package
 * import-boundary rules without a second, manually maintained
 * name-to-directory map. Fails closed: if any policy package cannot be
 * resolved to exactly one workspace directory, no directories are returned
 * and the caller must fail loudly rather than silently omit rules.
 *
 * @param {DependencyPolicy} policy
 * @param {WorkspacePackage[]} packages
 * @returns {{ directories: Map<string, string>, errors: string[] }}
 */
export function resolvePackageDirectories(policy, packages) {
  const errors = auditWorkspaceConsistency(policy, packages);
  /** @type {Map<string, WorkspacePackage[]>} */
  const byName = new Map();
  for (const pkg of packages) {
    const existing = byName.get(pkg.name) ?? [];
    existing.push(pkg);
    byName.set(pkg.name, existing);
  }

  /** @type {Map<string, string>} */
  const directories = new Map();
  if (errors.length === 0) {
    for (const policyName of Object.keys(policy.packages)) {
      const [match] = byName.get(policyName) ?? [];
      directories.set(policyName, match.dir);
    }
  }

  return { directories, errors };
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
 * name, source directory, and declared @cios/* dependency names from
 * `dependencies`, `devDependencies`, `optionalDependencies`, and
 * `peerDependencies` alike.
 *
 * Malformed (unparseable) manifests are never silently skipped: they are
 * collected into `manifestErrors` and the caller must treat their presence
 * as a hard failure. A directory with no package.json at all (not a
 * workspace package) is skipped, which is a different, non-failing case
 * from a package.json that exists but is invalid.
 *
 * @param {string} repoRoot
 * @param {string[]} workspaceGlobDirs directory names relative to repoRoot, e.g. ['apps', 'packages']
 * @returns {{ packages: WorkspacePackage[], manifestErrors: ManifestError[] }}
 */
export function discoverWorkspacePackages(repoRoot, workspaceGlobDirs) {
  /** @type {WorkspacePackage[]} */
  const packages = [];
  /** @type {ManifestError[]} */
  const manifestErrors = [];

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
      let rawContent;
      try {
        rawContent = readFileSync(manifestPath, 'utf8');
      } catch {
        // No package.json in this directory at all — not a workspace
        // package, distinct from an existing-but-malformed manifest.
        continue;
      }

      let manifest;
      try {
        manifest = parseManifestJson(rawContent, manifestPath);
      } catch (error) {
        if (error instanceof ManifestParseError) {
          manifestErrors.push({ manifestPath: error.manifestPath, message: error.message });
          continue;
        }
        throw error;
      }

      /** @type {Record<string, string[]>} */
      const dependencyFields = {};
      /** @type {Set<string>} */
      const allDependencyNames = new Set();
      for (const field of DEPENDENCY_FIELDS) {
        const names = Object.keys(manifest[field] ?? {}).filter((name) =>
          name.startsWith(CIOS_PREFIX),
        );
        dependencyFields[field] = names;
        for (const name of names) {
          allDependencyNames.add(name);
        }
      }

      packages.push({
        name: manifest.name,
        dir: path.relative(repoRoot, pkgDir),
        manifestPath,
        dependencies: [...allDependencyNames],
        dependencyFields,
      });
    }
  }

  return { packages, manifestErrors };
}

function main() {
  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
  const policyPath = path.join(repoRoot, 'docs', 'architecture', 'dependency-policy.json');
  const policy = loadPolicy(policyPath);
  const { packages, manifestErrors } = discoverWorkspacePackages(repoRoot, ['apps', 'packages']);

  /** @type {string[]} */
  const errors = [];

  for (const manifestError of manifestErrors) {
    errors.push(
      `Malformed manifest: ${manifestError.manifestPath} could not be parsed as valid JSON. ` +
        `Architecture validation fails closed on unparseable manifests — fix the JSON syntax in this ` +
        `file (it is not being treated as an absent/skipped package).`,
    );
  }

  errors.push(...auditWorkspaceConsistency(policy, packages));
  errors.push(...validateDependencyPolicy(policy, packages));

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
