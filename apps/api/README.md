# @cios/api

The interactive CIOS API runtime — a Fastify + TypeScript composition root
(see ADR 0003). This is where `@cios/application`, `@cios/infrastructure`,
and `@cios/contracts` are wired together for interactive request/response
traffic from `@cios/web` and other future clients.

## Status

Architecture foundation only (Directive 002). The only route implemented
is an operational health check (`GET /health`), which is infrastructure
scaffolding, not a product feature. No authentication, persistence, or
product endpoints exist yet.
