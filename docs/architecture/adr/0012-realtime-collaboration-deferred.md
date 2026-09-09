# 0012. Realtime Collaboration Deferred

## Status

Accepted (deferred)

## Context

CIOS may eventually support multiplayer/collaborative editing of creative
universes. Realtime collaboration infrastructure (WebSockets, CRDTs like
Yjs, presence systems) is a significant architectural commitment —
conflict resolution strategy, connection/session management, and
client-state synchronization all ripple through the domain and API
design. No current product requirement in Directive 002 demands it.

## Decision

Do not introduce WebSockets, CRDTs, Yjs, multiplayer editing
infrastructure, or realtime presence in Directive 002. Use ordinary
request/response (via `apps/api`, Fastify — ADR 0003) and event streaming
where adequate for now. The architecture leaves room for realtime
collaboration later (Fastify supports WebSockets/SSE; the
proposal/commit model in ADR 0006 does not preclude concurrent editing
support being added on top of it) but does not commit to a specific
approach today.

## Consequences

- No realtime dependency (Yjs, Socket.IO, etc.) is added to the
  dependency graph now.
- API design in later directives should avoid assumptions that would make
  adding realtime collaboration later prohibitively expensive (e.g.
  avoid modeling canonical mutations in a way that only makes sense for a
  single synchronous editor), but is not required to design for it
  explicitly yet.
- When a real product use case requires realtime collaboration, that
  directive will choose the specific technology (e.g. CRDT library,
  transport) against the actual requirement, not speculatively now.

## Alternatives Considered

- **Build in CRDT-based collaborative editing from the start**: rejected
  — no current use case justifies the complexity; the Constitution
  explicitly instructs "introduce realtime collaboration only when an
  actual product use case requires it."
- **Design the canonical data model explicitly around future CRDT
  merge semantics now**: rejected — would constrain the domain model
  (ADR 0006's propose/commit flow) around a specific future technology
  before it is needed.

## What Would Justify Revisiting

- A concrete product directive requires simultaneous multi-user editing of
  the same creative artifact with low-latency conflict resolution.
