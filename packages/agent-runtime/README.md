# @cios/agent-runtime

Boundary through which AI/agent/tool execution happens, sitting outside the pure domain layer (Constitution, section G; ADR 0010). Produces typed proposals/results defined in `@cios/contracts` — it never mutates canonical state directly. No provider adapters are implemented yet.

## Status

Architecture foundation only (Directive 002). This package intentionally
contains no product logic. See `docs/architecture/CONSTITUTION.md` and the
ADRs in `docs/architecture/adr/` for the reasoning behind this boundary.
