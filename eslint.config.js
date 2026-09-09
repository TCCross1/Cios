// ESLint flat config (ESLint 9+/10 format).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Single source of truth for CIOS internal (@cios/*) dependency direction.
// Mirrors scripts/check-architecture.mjs, which enforces the same policy at
// the package-manifest level. See docs/architecture/dependency-policy.json
// and docs/architecture/CONSTITUTION.md (section U, Dependency Direction).
const policyPath = fileURLToPath(
  new URL('./docs/architecture/dependency-policy.json', import.meta.url),
);
const policy = JSON.parse(readFileSync(policyPath, 'utf8'));

// Maps each governed @cios/* package name to the workspace directory whose
// source files that package's import rules apply to.
const packageDirectories = {
  '@cios/domain': 'packages/domain',
  '@cios/contracts': 'packages/contracts',
  '@cios/config': 'packages/config',
  '@cios/testkit': 'packages/testkit',
  '@cios/creative-graph': 'packages/creative-graph',
  '@cios/provenance': 'packages/provenance',
  '@cios/agent-runtime': 'packages/agent-runtime',
  '@cios/application': 'packages/application',
  '@cios/infrastructure': 'packages/infrastructure',
  '@cios/api': 'apps/api',
  '@cios/worker': 'apps/worker',
  '@cios/web': 'apps/web',
};

const allPackageNames = Object.keys(policy.packages);

/**
 * Builds one ESLint flat-config override enforcing the dependency-policy
 * "allowedDependencies" for a single @cios/* package's source directory,
 * using the built-in `no-restricted-imports` rule (covers static imports,
 * `export ... from`, and type-only imports — all are ImportDeclaration /
 * ExportNamedDeclaration nodes with a source module).
 */
function boundaryOverride(packageName) {
  const dir = packageDirectories[packageName];
  const allowed = new Set(policy.packages[packageName].allowedDependencies);
  const forbidden = allPackageNames.filter((name) => name !== packageName && !allowed.has(name));

  return {
    files: [`${dir}/**/*.ts`, `${dir}/**/*.tsx`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: forbidden.map((name) => ({
            name,
            message:
              `${packageName} may not import ${name} (Constitution, section U — Dependency Direction; ` +
              `docs/architecture/dependency-policy.json). If this dependency is genuinely required, it is ` +
              `an architecture decision: update the policy and document it via an ADR, do not bypass the check.`,
          })),
        },
      ],
      // Dynamic `import('@cios/...')` is a separate AST node
      // (ImportExpression) that `no-restricted-imports` does not cover;
      // restrict it explicitly so the boundary also applies to dynamic
      // imports, per Constitution section U.
      'no-restricted-syntax': [
        'error',
        ...forbidden.map((name) => ({
          selector: `ImportExpression[source.value='${name}']`,
          message: `${packageName} may not dynamically import ${name} (Constitution, section U — Dependency Direction).`,
        })),
      ],
    },
  };
}

const nodeGlobals = {
  URL: 'readonly',
  console: 'readonly',
  process: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
};

export default tseslint.config(
  {
    ignores: ['**/dist/**', '**/node_modules/**', '**/coverage/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['*.js', '*.mjs', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: nodeGlobals,
    },
  },
  ...Object.keys(packageDirectories).map(boundaryOverride),
);
