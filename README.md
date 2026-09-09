# CIOS — Creative Intelligence Operating System

> **Status: repository foundation only.** This repository does not yet
> implement any CIOS product features (Spark Engine, Canon Ledger, Creation
> Graph, AI agents, etc.). Those are defined by future architecture
> directives. This README documents only what currently exists.

## Requirements

- Node.js >= 20
- [pnpm](https://pnpm.io/) 9.x (enable via `corepack enable`)

## Getting started

```bash
# 1. Install dependencies (deterministic, uses pnpm-lock.yaml)
pnpm install

# 2. Create your local environment file
cp .env.example .env

# 3. Run the development entry point
pnpm dev
```

## Available scripts

| Script              | Purpose                                            |
| ------------------- | -------------------------------------------------- |
| `pnpm dev`          | Run the entry point in watch mode (`src/index.ts`) |
| `pnpm build`        | Compile TypeScript to `dist/` via `tsc`            |
| `pnpm start`        | Run the compiled build (`dist/index.js`)           |
| `pnpm test`         | Run the test suite once (Vitest)                   |
| `pnpm test:watch`   | Run the test suite in watch mode                   |
| `pnpm typecheck`    | Run TypeScript in `--noEmit` mode                  |
| `pnpm lint`         | Run ESLint                                         |
| `pnpm format`       | Format the repository with Prettier                |
| `pnpm format:check` | Check formatting without writing changes           |

All scripts exit with a non-zero status on failure.

## Environment configuration

See `.env.example` for the documented environment variables and the
public/server-secret naming convention. Never commit a real `.env` file —
it is already excluded via `.gitignore`.

## Project structure

```
src/            Application source (TypeScript)
tests/          Automated tests (Vitest)
docs/           Engineering documentation (architecture, product, engineering, testing)
assets/brand/   Location for official CIOS brand assets (not yet supplied)
.github/        CI workflows
```

## Quality gates

CI (`.github/workflows/ci.yml`) runs install, typecheck, lint, format check,
tests, and a production build on every push and pull request.
