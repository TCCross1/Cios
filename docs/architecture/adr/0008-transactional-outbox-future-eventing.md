# 0008. Transactional Outbox for Future Cross-Process Eventing

## Status

Accepted (design intent only — not implemented)

## Context

CIOS will eventually need to notify other processes (workers, search
indexers, projections, notification systems) when canonical state changes,
without losing events if a consumer is briefly unavailable, and without
introducing a message broker before there is a real, measured need for
one (Constitution §L, §M).

## Decision

The intended reliability strategy for cross-process domain/application
events is the **Transactional Outbox** pattern:

```
transaction → canonical mutation → provenance → transactional outbox → asynchronous consumer
```

A canonical mutation and its corresponding outbox row are written in the
same database transaction, guaranteeing the event is never lost or
duplicated relative to the mutation. A separate relay process/poller later
delivers outbox rows to consumers. No outbox table, relay, or consumer is
implemented in Directive 002 — this ADR fixes the intended pattern for
when eventing is introduced.

## Consequences

- No message broker (Kafka, NATS, RabbitMQ) is introduced now or assumed
  as a prerequisite for correctness; the outbox works with plain
  PostgreSQL polling initially and can be upgraded to broker-backed
  delivery later without changing the write-side guarantee.
- `apps/worker` is the natural home for the future outbox relay/consumer
  process.
- Application-layer use cases that mutate canonical state will eventually
  be responsible for writing the corresponding outbox row in the same
  transaction — this is a discipline the application layer must enforce
  once eventing exists.

## Alternatives Considered

- **Dual-write (mutate DB, then separately publish to a broker)**:
  rejected — well-known failure mode where the two writes can diverge if
  the process crashes between them, producing lost or duplicated events.
- **Adopt a broker (Kafka/NATS/RabbitMQ) immediately**: rejected —
  explicitly out of scope for Directive 002 and unnecessary until a real
  cross-process consumer exists; adds operational surface area with no
  current payoff.
- **Change Data Capture (CDC) off the WAL**: deferred, not rejected — a
  valid alternative to an explicit outbox table once/if adopted; can be
  reconsidered when real throughput requirements are known.

## What Would Justify Revisiting

- A concrete consumer (e.g. a search indexer or notification service)
  needs to react to canonical changes, at which point the outbox
  table/relay is actually implemented.
- Volume/latency requirements make PostgreSQL-polling delivery
  insufficient, justifying a broker-backed relay behind the same outbox
  contract.
