# @cios/web

The primary CIOS interactive workspace client: React + TypeScript + Vite
(ADR 0002). Talks to `@cios/api` over HTTP using types from
`@cios/contracts` only — it does not depend on `@cios/domain` or
`@cios/infrastructure` directly.

## Status

Architecture foundation only (Directive 002). Renders a single placeholder
page proving the dev/build toolchain works. No design system, routing,
state management, or product UI is implemented yet — see the CIOS visual
north star in the product/master context for what the eventual interface
will look like, and `docs/architecture/CONSTITUTION.md` section L for the
runtime rationale.
