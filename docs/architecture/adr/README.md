# Architecture Decision Records (ADRs)

Each ADR documents the context, decision, consequences, alternatives
considered, and what would justify revisiting one significant
architecture or technology choice for CIOS. ADRs are immutable once
accepted — a changed decision gets a new ADR that supersedes the old one,
rather than editing history.

| ADR                                                                      | Decision                                                                                   |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| [0001](./0001-pnpm-workspace-monorepo.md)                                | pnpm workspace monorepo                                                                    |
| [0002](./0002-react-vite-web-runtime.md)                                 | React + Vite for `apps/web`                                                                |
| [0003](./0003-fastify-api-runtime.md)                                    | Fastify + TypeScript for `apps/api`                                                        |
| [0004](./0004-postgresql-authoritative-persistence.md)                   | PostgreSQL as authoritative persistence                                                    |
| [0005](./0005-creative-intelligence-graph-is-domain-not-database.md)     | The Creative Intelligence Graph is a domain model, not a DB                                |
| [0006](./0006-ai-proposal-before-canonical-commit.md)                    | AI output is a proposal until accepted into canonical state                                |
| [0007](./0007-versioned-state-and-provenance.md)                         | Versioned canonical state + append-oriented provenance                                     |
| [0008](./0008-transactional-outbox-future-eventing.md)                   | Transactional Outbox for future cross-process eventing                                     |
| [0009](./0009-object-storage-for-large-assets.md)                        | Object storage for large creative assets                                                   |
| [0010](./0010-provider-independent-agent-runtime.md)                     | Provider-independent agent runtime                                                         |
| [0011](./0011-authentication-separated-from-authorization.md)            | Authentication separated from authorization                                                |
| [0012](./0012-realtime-collaboration-deferred.md)                        | Realtime collaboration deferred                                                            |
| [0013](./0013-creative-domain-kernel-identifiers-and-entity-subtypes.md) | Branded identifiers and entity subtype discriminated unions for the Creative Domain Kernel |
