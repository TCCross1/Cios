# 0004. PostgreSQL as Authoritative Persistence

## Status

Accepted

## Context

CIOS needs one authoritative persistence system for canonical structured
application data: entities, relationships, versions, provenance,
permissions, jobs, and references (Constitution §B, §C, §G). The product
name references a "Creative Intelligence Graph," which creates a
temptation to reach for a graph database by default.

## Decision

**PostgreSQL** is the authoritative persistence system for structured
canonical application data. Graph-shaped relationships (the CIG) are
initially modeled as explicit nodes/edges/relationship tables in
PostgreSQL, not in a specialized graph database. No database, schema, or
migration is implemented in Directive 002 — this ADR fixes the technology
choice for when persistence is introduced.

## Consequences

- `packages/infrastructure` will eventually own the PostgreSQL adapter(s)
  implementing interfaces defined by `packages/domain`/`packages/
application`.
- Large binary assets are not stored in PostgreSQL (see ADR 0009); only
  their metadata/lineage is.
- Semantic search, if introduced, targets PostgreSQL + `pgvector` before a
  dedicated vector database (Constitution §H).
- A specialized graph database (e.g. Neo4j) may be introduced later, but
  only behind the same domain/application interfaces, and only if
  measured query requirements (not naming coincidence) justify it.

## Alternatives Considered

- **Neo4j / dedicated graph database as primary store**: rejected as the
  _default_ — the CIG is a domain model, not a database technology
  (Constitution §B). Adopting a graph database prematurely would couple
  the domain model to a niche technology before real query patterns are
  known, and would complicate transactional consistency with the rest of
  canonical state (permissions, jobs, versions) that fits naturally in a
  relational store.
- **Document database (MongoDB, etc.)**: rejected — weaker transactional
  and relational-integrity guarantees for a domain with strong
  relationship and versioning requirements.
- **Multiple databases from day one (polyglot persistence)**: rejected —
  premature; adds operational complexity without demonstrated need.

## What Would Justify Revisiting

- Measured, production query patterns over the CIG that PostgreSQL
  (including recursive CTEs and relational modeling) cannot serve with
  acceptable latency at real scale.
- A specific graph-traversal workload (e.g. deep multi-hop relationship
  queries at high volume) that a graph database demonstrably solves
  better, validated with real data rather than assumption.
