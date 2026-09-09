# Architecture Documentation

This directory holds authoritative engineering architecture documentation
for CIOS.

- [`CONSTITUTION.md`](./CONSTITUTION.md) — the highest-level technical
  architecture authority: product identity, creator authority, the
  Creative Intelligence Graph, canonical state, provenance, deterministic
  truth, AI/agent execution boundaries, bounded agent responsibility,
  dependency direction, and repository topology. Established by
  Directive 002; amended by Directive 002R.
- [`adr/`](./adr/) — Architecture Decision Records documenting the context,
  decision, consequences, and alternatives considered for each major
  technology or boundary choice.
- [`dependency-policy.json`](./dependency-policy.json) — the
  machine-readable form of the Constitution's dependency-direction rules
  (section U). Consumed by `pnpm arch:check`
  (`scripts/check-architecture.mjs`) and by the ESLint source-import
  boundary rules in `eslint.config.js`, so dependency direction is
  mechanically enforced rather than convention-only (Directive 002R).

Product-level architecture (Creative Intelligence Kernel, Spark Engine,
Creation Graph domain entities, Canon Ledger, Story Genome, and related
systems) will be documented here as those systems are designed in future
directives. No such product architecture exists yet.
