# @cios/domain

Pure domain rules for CIOS. Expresses core domain concepts and invariants with no outward CIOS architectural dependencies: no web frameworks, no database drivers, no provider SDKs, no other CIOS packages. This is the innermost layer of the dependency direction defined in `docs/architecture/CONSTITUTION.md` (section U).

## Status

Architecture foundation only (Directive 002). This package intentionally
contains no product logic. See `docs/architecture/CONSTITUTION.md` and the
ADRs in `docs/architecture/adr/` for the reasoning behind this boundary.
