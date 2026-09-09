# Testing Documentation

This directory will hold the CIOS test strategy as it matures in future
directives (unit, integration, end-to-end, AI-agent evaluation testing).

## Current state (Directive 002)

Smoke tests prove Vitest is wired up correctly across the pnpm workspace:

- `apps/api/tests/health.test.ts` — exercises the real Fastify `/health`
  route via `app.inject`.
- `apps/worker/tests/index.test.ts` — exercises the worker startup
  placeholder, proving it can pass and fail.

Root `vitest.config.ts` discovers tests via `apps/*/tests/**/*.test.ts` and
`packages/*/tests/**/*.test.ts`. This is a baseline only — full test
architecture is out of scope for Directive 002.
