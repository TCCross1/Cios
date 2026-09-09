# Testing Documentation

This directory will hold the CIOS test strategy as it matures in future
directives (unit, integration, end-to-end, AI-agent evaluation testing).

## Current state (Directive 002)

Smoke tests prove Vitest is wired up correctly across the pnpm workspace:

- `apps/api/tests/health.test.ts` — exercises the real Fastify `/health`
  route via `app.inject`.
- `apps/worker/tests/index.test.ts` — exercises the worker startup
  placeholder, proving it can pass and fail.

Root `vitest.config.ts` discovers tests via `apps/*/tests/**/*.test.ts`,
`packages/*/tests/**/*.test.ts`, and `scripts/tests/**/*.test.mjs`. This is
a baseline only — full test architecture is out of scope for Directive 002.

## Architecture enforcement tests (Directive 002R)

- `scripts/tests/check-architecture.test.mjs` — exercises the
  package-manifest dependency-policy checker (`scripts/check-architecture.mjs`)
  against in-memory fixtures: a valid dependency graph, several unauthorized
  edges (e.g. `domain -> infrastructure`, `application -> infrastructure`,
  `web -> infrastructure`, `creative-graph -> application`), an unknown
  `@cios/*` package name, and a deliberately introduced cycle. Live
  `package.json` files are never modified to run these tests.
- `scripts/tests/eslint-boundaries.test.mjs` — exercises the ESLint
  source-import boundary rules in `eslint.config.js` using the ESLint Node
  API (`ESLint#lintText`) against in-memory source snippets (static, type-only,
  and dynamic imports), confirming both that forbidden imports are rejected
  and that allowed imports are accepted. No fixture files are committed
  inside production packages.
