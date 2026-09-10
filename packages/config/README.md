# @cios/config

Environment/configuration schema boundary. Intended home for future environment-variable parsing and validation shared by `apps/api` and `apps/worker`, following the public/server-secret naming convention documented in `.env.example` and the Constitution's security section (O). No parsing logic is implemented yet.

## Status

Architecture foundation only (Directive 002). This package intentionally
contains no product logic. See `docs/architecture/CONSTITUTION.md` and the
ADRs in `docs/architecture/adr/` for the reasoning behind this boundary.
