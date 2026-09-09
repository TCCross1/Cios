# @cios/infrastructure

Adapters implementing interfaces defined by the domain/application layers (persistence, object storage, AI providers, etc.), following the dependency-inversion rule in `docs/architecture/CONSTITUTION.md` (section R): infrastructure depends inward on domain/application contracts, never the reverse. No concrete adapters (PostgreSQL, S3, provider SDKs) are implemented yet.

## Status

Architecture foundation only (Directive 002). This package intentionally
contains no product logic. See `docs/architecture/CONSTITUTION.md` and the
ADRs in `docs/architecture/adr/` for the reasoning behind this boundary.
