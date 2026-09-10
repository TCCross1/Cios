import { DomainValidationError } from '../errors/domain-validation-error.js';

/**
 * Ordinary entity lifecycle state — an editorial/maintenance concern
 * ("is this entity actively being worked on, or retired?"). This is
 * deliberately unrelated to future Canon authority states (Raw
 * Inspiration, Candidate, Developing, Canon, Locked Canon, Alternate,
 * Deprecated, Rejected).
 *
 * ENTITY EXISTENCE DOES NOT IMPLY CANONICAL TRUTH. `LifecycleState`
 * answers "is this entity active in ordinary domain terms?" — it never
 * answers "is this entity's content authoritative creative truth?". That
 * second question belongs to a future Canon authority system layered on
 * top of (not merged into) entities that already exist. See
 * `docs/architecture/creative-domain-model.md`.
 *
 * - `draft` — newly created, still being defined.
 * - `active` — the entity's ordinary working state.
 * - `archived` — retired from active use but retained for history/
 *   reference; not deleted.
 *
 * DIRECTIVE 003R JUSTIFICATION FOR RETAINING `draft` (section 11): a
 * newly created creative object may exist structurally in CIOS before
 * the creator considers it operationally active — e.g. a newly created
 * `Character` still being defined, a `CreativeWork` shell created before
 * active development begins, or a newly entered `Rule` that exists but
 * has not yet entered ordinary active use. `draft` represents this
 * ordinary editing/existence maturity, not creative truth or Canon
 * authority. This does NOT imply `Candidate`, `Canon`, `Rejected`,
 * `Locked Canon`, or any future Canon-authority state — those remain the
 * responsibility of a future, entirely separate Canon system (see below).
 */
export type LifecycleState = 'draft' | 'active' | 'archived';

const LIFECYCLE_STATES: ReadonlySet<LifecycleState> = new Set(['draft', 'active', 'archived']);

/** Runtime type guard for `LifecycleState`. */
export function isLifecycleState(value: unknown): value is LifecycleState {
  return typeof value === 'string' && LIFECYCLE_STATES.has(value as LifecycleState);
}

/**
 * Validates `raw` as a `LifecycleState`, defaulting to `"draft"` when
 * omitted. Throws {@link DomainValidationError} for any unsupported value
 * (never silently coerces an unknown value to a supported one).
 */
export function resolveLifecycleState(raw: LifecycleState | undefined): LifecycleState {
  if (raw === undefined) {
    return 'draft';
  }
  if (!isLifecycleState(raw)) {
    throw new DomainValidationError(
      'lifecycle.unsupported',
      `Unsupported lifecycle state: ${JSON.stringify(raw)}. Supported values: ${[...LIFECYCLE_STATES].join(', ')}.`,
      'lifecycle',
    );
  }
  return raw;
}
