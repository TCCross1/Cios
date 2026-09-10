# @cios/application

Use-case orchestration across domain concerns. The application layer coordinates domain, creative-graph, and provenance operations, and is the intended home for the future proposal-acceptance use case that transitions AI proposals into canonical state (ADR 0006). It must not import web frameworks, database drivers, or provider SDKs directly (Constitution, section G, U).

## Status

Directive 005: implements the first real product logic in this package —
the Spark Engine (`src/spark/`): immutable capture of a creator's raw
inspiration or an imported reference (`SparkId`, `SparkRef`,
`SparkModality` (`text` | `voice` | `image` | `link` | `file`),
`SparkSource`, `Spark`, `captureSpark`). See
`docs/architecture/spark-engine.md` for the full model and
`docs/architecture/adr/0015-*.md` for the governing decisions.

This package still does **not** implement the Interpretation Engine, the
Canon Ledger, the Creation Graph engine, persistence, AI invocation, or
any product API/UI logic — see `docs/architecture/CONSTITUTION.md` and
the ADRs in `docs/architecture/adr/` for the reasoning behind this
boundary.
