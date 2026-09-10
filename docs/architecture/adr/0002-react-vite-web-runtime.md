# 0002. React + Vite Web Runtime

## Status

Accepted

## Context

The primary CIOS workspace (`apps/web`) is described in the CIOS master
context as a highly interactive, premium creative workspace — closer to a
studio/IDE than a document editor. It needs a client rendering model that
can evolve into a rich, stateful, real-time-capable interface without
being coupled to server rendering concerns. Directive 002 does not build
this interface, only its runtime boundary.

## Decision

Use **React + TypeScript + Vite** for `apps/web`.

- **React**: component model with the largest ecosystem for complex,
  highly interactive UI, including future canvas/graph-visualization and
  design-system needs.
- **Vite**: fast dev server and build tool, minimal configuration
  overhead, native ESM, first-class TypeScript support.
- No SSR framework (e.g. Next.js) is adopted — the web app is treated as a
  client-heavy application that talks to `apps/api` over HTTP/streaming,
  keeping canonical application logic entirely server-side.

## Consequences

- `apps/web` depends only on `packages/contracts` (wire-level types) at
  this stage — never on `packages/domain` or `packages/infrastructure`
  directly.
- No routing, state-management, or design-system library is chosen yet;
  those are product/UI directives, not Directive 002.
- Because there is no SSR layer, all authorization and canonical-state
  logic must live server-side (`apps/api`), consistent with the
  Constitution's authorization rules.

## Alternatives Considered

- **Next.js / Remix (SSR frameworks)**: rejected for now — SSR pulls
  server concerns into the frontend framework's lifecycle and creates
  pressure to blur the client/server boundary; CIOS explicitly wants a
  clean split between the interactive workspace and canonical
  server-owned state. Could be revisited if SEO/first-load performance
  for a public-facing surface becomes a requirement (unlikely for an
  authenticated creative workspace).
- **Vue / Svelte**: rejected — smaller ecosystem fit for the kind of
  complex, data-dense, graph-heavy visual tooling CIOS anticipates.
- **Electron/desktop-first**: rejected — web-first keeps the door open to
  desktop wrapping later without committing to it now.

## What Would Justify Revisiting

- A demonstrated need for SEO or unauthenticated public pages.
- A demonstrated need for server-rendered first paint performance that
  Vite's client-only model cannot satisfy.
