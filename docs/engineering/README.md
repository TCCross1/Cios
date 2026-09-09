# Engineering Documentation

This directory holds engineering process documentation: repository
conventions, coding standards, release process, and operational runbooks.

## Current conventions

- Package manager: pnpm workspace monorepo (see root `pnpm-workspace.yaml`
  and `package.json` `packageManager` field; ADR 0001).
- Language: TypeScript with strict compiler settings shared via
  `tsconfig.base.json` and extended per app/package.
- Linting: ESLint flat config (`eslint.config.js`), applied repository-wide.
- Formatting: Prettier (`.prettierrc.json`), applied repository-wide.
- Tests: Vitest (`vitest.config.ts`), test files live in each app/package's
  `tests/` directory.
- Architecture authority: `docs/architecture/CONSTITUTION.md` and the ADRs
  in `docs/architecture/adr/`.
- Repository topology: `apps/{web,api,worker}` (deployable runtimes) and
  `packages/{domain,application,contracts,creative-graph,provenance,
agent-runtime,infrastructure,config,testkit}` (internal libraries), per
  the Constitution's dependency-direction rules (section R).
