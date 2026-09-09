# CIOS Architecture Constitution

Status: **Authoritative** (established by Directive 002)

This document is the highest-level _technical architecture_ authority for
CIOS, beneath the CIOS product/master context. Every later directive,
package, and pull request must be consistent with it. If a future
requirement conflicts with an invariant here, the conflict must be
documented explicitly (e.g. in an ADR) rather than silently violated.

This directive establishes architecture and repository topology only. It
does **not** implement product features, the Creative Intelligence Graph
domain model, AI provider integrations, authentication, persistence, or UI.
Those are later directives.

---

## A. Product Identity

CIOS is not a chatbot, generic writing application, note-taking
application, document editor, or AI text generator.

CIOS is a **Creative Intelligence Operating System** whose intelligence
exists to preserve, understand, connect, challenge, structure, simulate,
and help produce human creative work across novels, film, television,
animation, narrative games, RPGs, graphic narratives, and cross-media
intellectual property.

Conversational interfaces may exist inside CIOS, but conversation is an
**interface** to the system — it is not the architecture of the system.
No package, app, ADR, or future directive may collapse CIOS's architecture
into a single generic conversational-assistant pattern merely because a
chat surface is convenient to build.

---

## B. Creator Authority

Canonical creative state belongs to the creator.

AI output is a **proposal** until explicitly accepted through an
application/domain operation authorized by the creator or an explicitly
delegated policy. No AI provider, agent, worker, plugin, tool, or
infrastructure adapter may directly mutate canonical creative state.

Conceptual flow:

```
OBSERVE → ANALYZE → PROPOSE → REVIEW / POLICY CHECK →
CREATOR OR AUTHORIZED DECISION → COMMIT → VERSION → PROVENANCE → PROJECT
```

The architecture must preserve the distinction between:

- generated output
- proposal
- accepted change
- canonical state
- derived projection

These are different lifecycle stages of information and must never be
conflated into a single undifferentiated "AI wrote this" blob.

---

## C. Creative Intelligence Graph (CIG)

The Creative Intelligence Graph is the canonical **relationship model**
through which CIOS understands creative universes. The CIG is a **domain
model**, not a database technology. Do not adopt Neo4j or another graph
database merely because the word "Graph" appears in the product name.

**Initial architectural decision:** PostgreSQL is the authoritative
persistence system for structured canonical application data. Graph-shaped
relationships are initially persisted in PostgreSQL using explicit
nodes/edges/relationship tables and ordinary relational structures. A
specialized graph database may be introduced later _only if_ measured query
requirements justify it (see ADR 0005).

No CIG business entities (nodes, edge types, story/character/world
concepts) are created in Directive 002. `packages/creative-graph` exists
only as the architectural boundary for this future domain model.

---

## D. Canonical State

CIOS has exactly one authoritative canonical state, owned behind the
domain/application boundary and the authoritative persistence layer.

The following are explicitly **not** permitted to become canonical truth:

- frontend state
- AI-provider memory / context windows
- vector embeddings
- search indexes
- caches
- agent scratchpads
- generated files (merely because they exist on disk/object storage)

Search indexes, embeddings, graph projections, caches, and generated
previews are **derived** and must be reproducible from authoritative
sources where reasonably possible.

---

## E. Provenance

Every meaningful committed creative change must eventually be capable of
answering:

- What changed?
- Who or what proposed it?
- Who approved it?
- What source material influenced it?
- What prior version did it derive from?
- What tools/models participated?
- When did it happen?
- What resulting version became canonical?
- Can the lineage be reconstructed?

**CIOS uses versioned canonical state + append-oriented provenance/audit
history.** This does not require full event sourcing for the entire
system, and domain objects should not be forced into pure event-sourced
aggregates without demonstrated need. `packages/provenance` is the
architectural home for this concern; no provenance schema or storage is
implemented in Directive 002.

---

## F. Deterministic Truth

When a fact, invariant, transformation, relationship, validation,
permission, chronology calculation, identifier rule, schema rule,
mathematical result, state transition, or other **mechanical truth** can be
determined reliably by normal software, CIOS must prefer deterministic code
over asking a generative model to decide it.

AI must be used where interpretation, ambiguity, creativity, synthesis,
judgment, or probabilistic reasoning are actually needed — not as a
default substitute for logic that conventional software can compute,
validate, or enforce.

Illustrative (non-exhaustive) examples of mechanical truth that must remain
deterministic:

- identifier generation and uniqueness rules
- referential integrity between canonical records
- ordering/chronology of versions and provenance events
- schema/shape validation of stored or transmitted data
- permission/authorization decisions
- arithmetic, counting, and other computable results
- state-machine transitions (e.g. proposal → accepted → canonical)

**AI confidence must never substitute for deterministic truth where
deterministic truth is available.** An AI system may recommend, flag, or
explain, but it may not become the source of truth for something a
compiler, validator, or domain rule can already guarantee.

---

## G. AI / Agent Execution

AI and agent execution sit **outside** the pure domain layer.

Domain code (`packages/domain`, `packages/creative-graph`,
`packages/provenance`) must never import:

- OpenAI/Anthropic/Google/model-provider SDKs
- browser automation libraries
- third-party tool APIs
- queue implementations

The domain expresses rules. The application layer (`packages/application`)
orchestrates use cases. The agent/tool runtime (`packages/agent-runtime`)
executes external intelligence. Infrastructure adapters
(`packages/infrastructure`) connect providers. AI results return as typed
proposals/evidence/results — they never directly mutate canonical state.

---

## H. Bounded Agent Responsibility

Future CIOS agents must have **bounded responsibilities**.

- No specialist agent may receive unrestricted authority over the complete
  Creative State.
- Agent capabilities must be scoped according to role, not according to
  what the underlying model is technically capable of doing.
- Agents may read only the context required for their task where
  practical.
- **Write authority must be narrower than read authority.** An agent that
  can observe broad context does not thereby gain broad authority to
  mutate it.
- Most AI operations should produce structured findings, recommendations,
  hypotheses, drafts, or proposals rather than silently mutating
  authoritative state (see §B/§F, Creator Authority and Deterministic
  Truth).
- No future agent may become an unbounded, generic "do everything"
  intelligence simply because a model is capable of broad reasoning.
- A future Creative Chief (or equivalent orchestrator) may coordinate
  specialist intelligence, but orchestration does not make specialist
  boundaries optional — orchestration composes bounded agents, it does not
  dissolve their boundaries.

No agents are implemented in Directive 002 or this remediation; this
section documents the rule that future agent-runtime work must follow.

---

## I. Provider Independence

CIOS must not architect itself around any single AI vendor.
Provider-specific integrations belong behind explicit adapters in
`packages/infrastructure`. Core contracts represent _capabilities_, such as:

- text generation
- structured generation
- reasoning/research request
- embedding
- image generation
- audio generation
- video generation
- external tool execution

These adapters are **not implemented** in Directive 002 — only the
`packages/agent-runtime` and `packages/infrastructure` boundaries are
established (see ADR 0010).

---

## J. Large Creative Assets

Large binary assets are not stored directly in PostgreSQL unless a future
documented exception requires it.

- **PostgreSQL**: canonical structured metadata, relationships, versions,
  provenance, permissions, jobs, references.
- **S3-compatible object storage**: images, audio, video, project exports,
  large documents, generated media, source binaries.

Object storage is not itself canonical metadata authority — the database
owns the authoritative asset record and lineage. Object storage is not
implemented in Directive 002 (see ADR 0009).

---

## K. Vector / Semantic Search

Embeddings are derived representations and are never canonical truth.
Initial architecture favors PostgreSQL + `pgvector` if/when semantic
retrieval is introduced. A dedicated vector database is not introduced
until scale or workload proves it necessary. Not implemented in
Directive 002.

---

## L. Events

Domain/application operations may eventually emit events. Architecture
anticipates:

```
transaction → canonical mutation → provenance → transactional outbox → asynchronous consumer
```

The **Transactional Outbox** pattern is the intended reliability strategy
for cross-process domain/application events (see ADR 0008). No outbox,
and no broker (Kafka/NATS/RabbitMQ), is implemented in Directive 002.

---

## M. Background Work

CIOS requires long-running work: AI generation, media processing,
rendering, analysis, ingestion, indexing, production workflows. This work
belongs in a worker runtime (`apps/worker`) separate from interactive API
request execution. It is **not** bound to Redis, BullMQ, Temporal, or
pg-boss in Directive 002 — queue/workflow implementation must remain
replaceable through application/infrastructure contracts until real
workload requirements exist.

---

## N. API

The interactive backend is a dedicated API runtime: **Fastify + TypeScript**
(`apps/api`), chosen for being lightweight, having an explicit server
boundary, a strong TypeScript ecosystem, good schema/validation support,
independence from the frontend runtime, and suitability for REST/JSON APIs,
streaming, and future realtime extensions (see ADR 0003). No product
endpoints are implemented in Directive 002.

---

## O. Web Application

The primary CIOS workspace is a client-heavy web application:
**React + TypeScript + Vite** (`apps/web`), chosen for being highly
interactive, cleanly separated from the API, independent of the server
runtime, backed by a strong ecosystem, compatible with future desktop
wrapping, and avoiding coupling canonical application logic to an SSR
framework (see ADR 0002). The interface itself is not built in
Directive 002.

---

## P. Realtime / Collaboration

WebSockets, CRDTs, Yjs, multiplayer editing infrastructure, and realtime
presence are not introduced in Directive 002. The architecture leaves room
for them. Rule: use normal request/response and event streaming where
adequate; introduce realtime collaboration only when an actual product use
case requires it (see ADR 0012).

---

## Q. Authentication / Authorization

Authentication provider selection is deferred. The architecture separates:

- **identity authentication** — proving who a user is (external identity
  provider's responsibility)
- **CIOS authorization** — what that identity may do inside organizations,
  workspaces, universes, projects, assets, graph entities, proposals, and
  canonical commits (CIOS domain/application rules' responsibility)

Authorization rules must never be hard-coded into UI components. No
authentication is implemented in Directive 002 (see ADR 0011).

---

## R. Security

- Server secrets never enter frontend bundles.
- Public environment variables require an explicit naming convention.
- Least privilege everywhere (CI, infrastructure credentials, provider
  scopes).
- External tool execution is treated as an untrusted boundary.
- User-provided files are treated as untrusted inputs.
- AI output is treated as untrusted structured input until validated.
- Canonical mutations require validated application operations.
- Authorization is enforced server-side, never client-side only.
- Auditability is required for sensitive canonical actions.
- No provider SDK receives broader context/data than needed.
- Provenance records must not leak secrets.

---

## S. Observability

Architect for future structured logging, metrics, tracing, job diagnostics,
and auditability. Target standard: **OpenTelemetry-compatible**
observability. No telemetry stack is implemented in Directive 002.

---

## T. No Generic Shared Dumping Ground

Do not create packages named `utils`, `helpers`, or `common` unless a later
directive identifies a precise bounded responsibility. Shared code must
have a named architectural purpose (e.g. `packages/config`,
`packages/testkit`, `packages/contracts`), not a catch-all location.

---

## U. Dependency Direction

```
apps
  ↓
application
  ↓
domain
```

Infrastructure depends **inward** through contracts/interfaces (dependency
inversion) — the domain and application layers define the interfaces they
need, and `packages/infrastructure` implements them, never the reverse.

The domain (`packages/domain`, `packages/creative-graph`,
`packages/provenance`) must not depend on:

- applications (`apps/*`)
- web frameworks
- Fastify
- React
- databases
- queues
- provider SDKs
- operating-system-specific implementations
- external services

Contracts shared with external clients (`packages/contracts`) must not leak
persistence-specific models. See ADR 0004, 0005, 0006, 0007, 0010.

---

## Repository Topology (established by Directive 002)

```
apps/
  web/            React + Vite interactive workspace client (contracts only)
  api/            Fastify interactive API runtime (composition root)
  worker/         Background/long-running job runtime (composition root)

packages/
  domain/            Pure domain rules — no outward CIOS architectural dependencies
  application/        Use-case orchestration across domain concerns
  contracts/          Wire-level types shared with external clients
  creative-graph/      CIG domain model boundary (no entities yet)
  provenance/          Versioning/provenance domain boundary (no schema yet)
  agent-runtime/       AI/agent/tool execution boundary (no providers yet)
  infrastructure/      Adapters implementing domain/application interfaces
  config/              Environment/config schema boundary
  testkit/             Shared test fixtures/harnesses (dev-only)
```

Every package/app in Directive 002 contains only the minimum foundation
necessary to exist as an addressable, buildable, typed unit: a
`package.json`, a `tsconfig.json`, a `README.md` documenting its
architectural purpose, and a placeholder `src/index.ts` with no product
logic. See the ADRs in `docs/architecture/adr/` for the reasoning behind
each major technology and boundary decision.
