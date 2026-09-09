# 0011. Authentication Separated From Authorization

## Status

Accepted (boundary established — no auth implemented)

## Context

CIOS needs to know who a user is (authentication) and separately what that
identity is allowed to do inside organizations, workspaces, universes,
projects, assets, graph entities, proposals, and canonical commits
(authorization). Picking an identity provider is a separate concern from
designing CIOS's own permission model, and conflating the two tends to
leak vendor-specific concepts (e.g. a provider's role/claim format)
directly into domain authorization logic.

## Decision

Authentication (proving identity) and authorization (CIOS's own rules
about what an identity may do) are architecturally separate concerns.
Authentication is expected to be handled by an external identity
provider, whose output CIOS treats as "an authenticated identity," never
as CIOS's authorization model directly. Authorization rules live in
`packages/domain`/`packages/application`, evaluated server-side (in
`apps/api`/`apps/worker`), never hard-coded into UI components in
`apps/web`.

No authentication provider is selected, and no authorization model is
implemented, in Directive 002.

## Consequences

- `apps/web` never makes authorization decisions on its own — it may hide
  UI affordances for a better UX, but the server is always the actual
  enforcement point.
- Swapping identity providers later should not require rewriting CIOS's
  authorization rules, because those rules are expressed in terms of
  CIOS's own identity/permission concepts, not the provider's token
  format.
- A future directive will define the actual authorization model
  (roles/permissions/policies) inside `packages/domain`/
  `packages/application`.

## Alternatives Considered

- **Let the identity provider's roles/claims drive authorization
  directly**: rejected — couples CIOS's permission model to a specific
  provider's data shape and makes provider migration expensive.
- **Enforce authorization only in the frontend**: rejected outright — an
  explicit security requirement in the Constitution (§R): "authorization
  enforced server-side."

## What Would Justify Revisiting

- A specific identity provider is selected in a future directive — that
  selection should slot behind this boundary without changing the
  separation principle itself.
