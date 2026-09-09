# 0010. Provider-Independent Agent Runtime

## Status

Accepted (boundary established — no providers implemented)

## Context

CIOS will use one or more AI providers (text generation, structured
generation, reasoning/research, embeddings, image/audio/video generation,
external tool execution). Coupling the domain or application layers
directly to a specific provider SDK would make CIOS architecturally
dependent on that vendor's API shape, pricing model, and availability, and
would violate the domain-layer isolation rule in the Constitution (§E).

## Decision

Introduce `packages/agent-runtime` as the boundary through which AI/agent
execution happens, and `packages/infrastructure` as the home for
provider-specific adapters. Core contracts represent **capabilities** —
text generation, structured generation, reasoning/research request,
embedding, image generation, audio generation, video generation, external
tool execution — not specific vendors. `packages/domain`,
`packages/application`, `packages/creative-graph`, and
`packages/provenance` must never import a model-provider SDK directly.

No provider adapters (OpenAI, Anthropic, Google, etc.) are implemented in
Directive 002 — only the package boundary and its position in the
dependency graph.

## Consequences

- Swapping or adding a provider means writing a new adapter in
  `packages/infrastructure` that satisfies an existing capability
  contract, not changing domain/application code.
- `packages/agent-runtime` depends on `packages/contracts` for the typed
  proposal/result shapes it produces (see ADR 0006) — it does not depend
  on `packages/domain` internals.
- Multi-provider strategies (e.g. routing by capability, cost, or
  fallback) become an infrastructure/application concern, not a
  domain concern.

## Alternatives Considered

- **Import a provider SDK directly wherever generation is needed**:
  rejected — this is precisely what the Constitution's domain-isolation
  rule and provider-independence principle (§E, §F) forbid; it would
  scatter vendor lock-in throughout the codebase.
- **A single mega "AI service" class with vendor-specific branches
  everywhere**: rejected — mixes capability dispatch with vendor
  implementation detail in one place, making it hard to test or replace a
  single provider without touching unrelated capabilities.

## What Would Justify Revisiting

- A capability emerges that does not fit the existing capability
  taxonomy (text/structured/reasoning/embedding/image/audio/video/tool
  execution) — extend the contract set, not the isolation rule itself.
