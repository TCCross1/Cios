# 0003. Fastify API Runtime

## Status

Accepted

## Context

CIOS needs a dedicated interactive backend runtime (`apps/api`) that
exposes canonical operations to `apps/web` and other future clients. This
runtime is the composition root where `packages/application`,
`packages/infrastructure`, and `packages/contracts` are wired together. It
must support ordinary REST/JSON request-response, streaming, and future
realtime extensions without committing to a specific realtime technology
yet.

## Decision

Use **Fastify + TypeScript** for `apps/api`.

Reasons:

- **Lightweight**: minimal framework overhead, explicit plugin/route model.
- **Explicit server boundary**: routes and their contracts are declared,
  not implied by file-system conventions tied to a frontend framework.
- **Strong TypeScript ecosystem**: first-class TypeScript support and
  schema-driven request/response typing.
- **Good schema/validation support**: works well with JSON Schema or
  TypeBox-style validation for validating untrusted input at the
  boundary (consistent with the Constitution's security rules).
- **Independent from the frontend runtime**: no coupling to React/Vite's
  lifecycle or bundling.
- **Suitable for REST/JSON APIs, streaming, and future realtime
  extensions** (e.g. Server-Sent Events, WebSockets) without locking in a
  specific realtime strategy now.

## Consequences

- `apps/api` depends on `packages/application`, `packages/infrastructure`,
  `packages/contracts`, and `packages/config`.
- No product endpoints, authentication, or database wiring are implemented
  in Directive 002 — only the runtime boundary and its dependency graph.
- Input validation at the Fastify boundary becomes the natural place to
  enforce "AI output / user input is untrusted until validated."

## Alternatives Considered

- **Express**: rejected — weaker native TypeScript ergonomics and schema
  validation story compared to Fastify.
- **NestJS**: rejected — heavier, opinionated DI/module framework that
  would pull architectural decisions (module structure, decorators) into
  the API runtime that CIOS prefers to keep in `packages/application`
  instead.
- **tRPC**: deferred — attractive for the web↔API boundary, but couples
  client and server types more tightly than a contracts package; can be
  reconsidered once `packages/contracts` proves insufficient.
- **Hono / Bun-native runtimes**: rejected for now — smaller ecosystem
  maturity for the validation/plugin needs anticipated here.

## What Would Justify Revisiting

- A demonstrated need for heavier compile-time RPC type-sharing that
  `packages/contracts` cannot satisfy efficiently.
- A demonstrated performance ceiling Fastify cannot meet.
