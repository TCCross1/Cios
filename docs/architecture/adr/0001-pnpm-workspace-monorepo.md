# 0001. pnpm Workspace Monorepo

## Status

Accepted

## Context

CIOS will eventually consist of multiple runtimes (interactive API,
background worker, web client) and multiple internal packages with strict
dependency-direction rules (domain, application, contracts,
creative-graph, provenance, agent-runtime, infrastructure, config,
testkit). These need to:

- share a single TypeScript/lint/format toolchain and quality gates
- enforce internal dependency direction at install time
- avoid version drift between packages
- support atomic cross-package changes reviewed in a single pull request

Directive 001 already established pnpm as the package manager for the
repository.

## Decision

Use a **pnpm workspace monorepo** (`pnpm-workspace.yaml`) with two
top-level groups: `apps/*` (deployable runtimes) and `packages/*` (internal
libraries). Internal packages reference each other via the
`workspace:*` protocol. A single root lockfile (`pnpm-lock.yaml`) remains
the source of truth for all dependencies across the repository.

## Consequences

- One `pnpm install` at the repository root installs everything.
- Internal packages are versioned together; there is no independent
  publishing/versioning story yet (not needed pre-product).
- Root-level scripts (`typecheck`, `lint`, `format`, `test`, `build`) must
  be defined to operate across the workspace (via `pnpm -r` or TypeScript
  project references), which Directive 002 establishes.
- Adding a new package/app is cheap: a `package.json` + `tsconfig.json`
  entry, no separate repository or CI wiring.

## Alternatives Considered

- **Multiple repositories** (polyrepo): rejected — increases coordination
  overhead for a project whose domain/application/infrastructure
  boundaries change together frequently pre-1.0.
- **Turborepo / Nx on top of pnpm**: deferred — adds build-caching and
  task-orchestration value, but not required at this repository's current
  size. Nothing in this decision precludes adopting one later.
- **Single flat package (no workspace)**: rejected — cannot express the
  dependency-direction invariants (domain must not depend on apps/web
  frameworks/infrastructure) without separate installable units.

## What Would Justify Revisiting

- Package count/build times grow large enough that task orchestration or
  remote caching (Turborepo/Nx) becomes necessary.
- A package needs an independent release cadence or external publication,
  requiring changeset/versioning tooling.
