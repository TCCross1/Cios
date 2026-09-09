/**
 * @cios/agent-runtime
 *
 * Boundary through which AI/agent/tool execution happens, sitting outside the pure domain layer (Constitution, section E; ADR 0010). Produces typed proposals/results defined in `@cios/contracts` — it never mutates canonical state directly. No provider adapters are implemented yet.
 *
 * This module is intentionally empty of product logic. It exists only to
 * make the package a valid, buildable, typed TypeScript project during
 * Directive 002 (architecture + repository topology). Do not add domain,
 * application, or infrastructure logic here until a later directive
 * defines it.
 */

export {};
