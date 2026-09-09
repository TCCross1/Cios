# @cios/contracts

Wire-level types shared with external clients (e.g. the web app and any future API consumers). Contracts must never leak persistence-specific models from the domain or infrastructure layers (Constitution, section R). This package has no runtime dependencies — it only exports types/shapes.

## Status

Architecture foundation only (Directive 002). This package intentionally
contains no product logic. See `docs/architecture/CONSTITUTION.md` and the
ADRs in `docs/architecture/adr/` for the reasoning behind this boundary.
