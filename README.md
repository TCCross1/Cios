# CIOS — Creative Intelligence Operating System

> **Status: architecture foundation only.** This repository does not yet
> implement any CIOS product features (Spark Engine, Canon Ledger, Creation
> Graph entities, AI agents, etc.). Directive 001 established the base
> toolchain; Directive 002 established the architecture constitution and
> pnpm workspace topology described below. This README documents only what
> currently exists.

See [`docs/architecture/CONSTITUTION.md`](./docs/architecture/CONSTITUTION.md)
for the authoritative technical architecture and
[`docs/architecture/adr/`](./docs/architecture/adr/) for the reasoning
behind each major technology/boundary decision.

## Requirements

- Node.js >= 20
- [pnpm](https://pnpm.io/) 9.x (enable via `corepack enable`)

## Getting started

```bash
# 1. Install dependencies for the whole workspace (deterministic, uses pnpm-lock.yaml)
pnpm install

# 2. Create your local environment file
cp .env.example .env

# 3. Run the primary interactive workspace (apps/web) in dev mode
pnpm dev
```

## Repository topology

This is a pnpm workspace monorepo (ADR 0001):

```
apps/
  web/      React + Vite interactive workspace client (ADR 0002)
  api/      Fastify interactive API runtime (ADR 0003)
  worker/   Background/long-running job runtime

packages/
  domain/            Pure domain rules — no outward CIOS architectural dependencies
  application/        Use-case orchestration across domain concerns
  contracts/          Wire-level types shared with external clients
  creative-graph/      Creative Intelligence Graph domain boundary (no entities yet)
  provenance/          Versioning/provenance domain boundary (no schema yet)
  agent-runtime/       AI/agent/tool execution boundary (no providers yet)
  infrastructure/      Adapters implementing domain/application interfaces
  config/              Environment/config schema boundary
  testkit/             Shared test fixtures/harnesses (dev-only)

docs/           Engineering documentation (architecture, product, engineering, testing)
assets/brand/   Location for official CIOS brand assets (not yet supplied)
.github/        CI workflows
```

Every app/package currently contains only the minimum foundation needed to
build and typecheck: a `package.json`, a `tsconfig.json`, a `README.md`
describing its architectural purpose, and a placeholder `src/index.ts`
with no product logic. Dependency direction between packages follows
`docs/architecture/CONSTITUTION.md` section R.

## Available scripts

Run from the repository root; each operates across the whole workspace
unless noted otherwise.

| Script              | Purpose                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| `pnpm dev`          | Run `apps/web` in dev mode (the primary interactive workspace)                                      |
| `pnpm build`        | Build every app/package (`pnpm -r run build`, topological order)                                    |
| `pnpm start`        | Run the built `apps/api` server (`node dist/index.js`)                                              |
| `pnpm test`         | Run the test suite once across the workspace (Vitest)                                               |
| `pnpm test:watch`   | Run the test suite in watch mode                                                                    |
| `pnpm typecheck`    | Typecheck every app/package (`pnpm -r run typecheck`)                                               |
| `pnpm arch:check`   | Validate `@cios/*` package-manifest dependencies against `docs/architecture/dependency-policy.json` |
| `pnpm lint`         | Run ESLint across the whole repository (also enforces `@cios/*` source-import boundaries)           |
| `pnpm format`       | Format the repository with Prettier                                                                 |
| `pnpm format:check` | Check formatting without writing changes                                                            |

To target a single app/package, use pnpm's `--filter` flag, e.g.:

```bash
pnpm --filter @cios/api dev
pnpm --filter @cios/worker dev
pnpm --filter @cios/web build
```

All scripts exit with a non-zero status on failure.

## Environment configuration

See `.env.example` for the documented environment variables and the
public/server-secret naming convention. Never commit a real `.env` file —
it is already excluded via `.gitignore`.

## Quality gates

CI (`.github/workflows/ci.yml`) runs install, an architecture check
(`pnpm arch:check`), typecheck, lint, format check, tests, and a production
build on every push and pull request.
