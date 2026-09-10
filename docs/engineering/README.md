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
  the Constitution's dependency-direction rules (section U).
- **Dependency direction is mechanically enforced, not just documented**
  (Directive 002R; hardened by Directive 002R2):
  - `pnpm arch:check` (`scripts/check-architecture.mjs`) validates every
    workspace `package.json`'s declared `@cios/*` references in
    `dependencies`, `devDependencies`, `optionalDependencies`, and
    `peerDependencies` alike against `docs/architecture/dependency-policy.json`,
    and detects unknown internal package names and circular internal
    dependencies. It is a required CI gate (`.github/workflows/ci.yml`), run
    before typecheck.
  - The checker **fails closed**: a malformed (unparseable) `package.json` is
    reported as an explicit violation identifying the manifest path — it is
    never silently skipped or treated as an absent package. It also verifies
    that policy and workspace membership stay synchronized (every workspace
    `@cios/*` package is declared in the policy, every policy package
    resolves to exactly one workspace directory, and no two workspace
    packages share a name).
  - `pnpm lint` (`eslint.config.js`) additionally enforces the same policy
    at the **source-import** level via `no-restricted-imports` (static,
    `export ... from`, and type-only imports) and `no-restricted-syntax`
    (dynamic `import()`), scoped per package/app directory. The per-package
    source directories used to scope these rules are **discovered from the
    actual workspace** (via `discoverWorkspacePackages`/
    `resolvePackageDirectories` in `scripts/check-architecture.mjs`) rather
    than duplicated in a second, manually maintained map — a package
    move/rename/add cannot silently disable enforcement, and if a
    policy-controlled package cannot be resolved to exactly one workspace
    directory, ESLint config generation fails loudly instead of omitting
    rules for it.
  - Both mechanisms read from the same policy file
    (`docs/architecture/dependency-policy.json`), so there is a single
    source of truth for "who may depend on whom."
  - **Adding a new internal package or changing an allowed dependency is an
    architecture decision.** Update
    `docs/architecture/dependency-policy.json` (which drives both
    `arch:check` and the ESLint boundary rules) and record the reasoning in
    an ADR — do not bypass the checker with `eslint-disable`, `ts-ignore`,
    wildcard allowlists, or other escape hatches.
  - Tests for the checker itself and the ESLint boundary rules live in
    `scripts/tests/`.
