/**
 * @cios/infrastructure
 *
 * Adapters implementing interfaces defined by the domain/application layers (persistence, object storage, AI providers, etc.), following the dependency-inversion rule in `docs/architecture/CONSTITUTION.md` (section R): infrastructure depends inward on domain/application contracts, never the reverse. No concrete adapters (PostgreSQL, S3, provider SDKs) are implemented yet.
 *
 * This module is intentionally empty of product logic. It exists only to
 * make the package a valid, buildable, typed TypeScript project during
 * Directive 002 (architecture + repository topology). Do not add domain,
 * application, or infrastructure logic here until a later directive
 * defines it.
 */

export {};
