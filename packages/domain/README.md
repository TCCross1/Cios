# @cios/domain

Pure domain rules for CIOS. Expresses core domain concepts and invariants with no outward CIOS architectural dependencies: no web frameworks, no database drivers, no provider SDKs, no other CIOS packages. This is the innermost layer of the dependency direction defined in `docs/architecture/CONSTITUTION.md` (section U).

## Status

Directive 003: implements the foundational Creative Domain Kernel —
`CreativeUniverse`, `CreativeWork`, `CreativeFormat`, the `CreativeEntity`
foundation (`EntityKind`, `EntityScope`, `EntityRef`,
`CreativeEntityIdentity`/`CreativeEntityLifecycle`), the foundational
entity subtypes (`Character`, `Location`, `CreativeObject`, `Faction`,
`CreativeEvent`, `Concept`, `Theme`, `Rule`), `TemporalReference`,
`LifecycleState`, and branded identifiers (`UniverseId`, `WorkId`,
`EntityId`). See `docs/architecture/creative-domain-model.md` for the
full model and terminology, and `docs/architecture/adr/0013-*.md` for the
identifier/entity-subtype strategy.

This package intentionally contains no Canon/Canon Ledger, Spark Engine,
Creation Graph engine, provenance, persistence, AI, or product API/UI
logic — see `docs/architecture/creative-domain-model.md`, "Intentionally
Deferred Systems". See `docs/architecture/CONSTITUTION.md` and the ADRs
in `docs/architecture/adr/` for the reasoning behind this boundary.
