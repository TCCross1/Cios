# @cios/application

Use-case orchestration across domain concerns. The application layer coordinates domain, creative-graph, and provenance operations, and is the intended home for the future proposal-acceptance use case that transitions AI proposals into canonical state (ADR 0006). It must not import web frameworks, database drivers, or provider SDKs directly (Constitution, section E, R).

## Status

Architecture foundation only (Directive 002). This package intentionally
contains no product logic. See `docs/architecture/CONSTITUTION.md` and the
ADRs in `docs/architecture/adr/` for the reasoning behind this boundary.
