import { generateEntityId, isEntityId, type EntityId } from '../ids/entity-id.js';
import { DomainValidationError } from '../errors/domain-validation-error.js';
import { resolveLifecycleState, type LifecycleState } from '../lifecycle/lifecycle-state.js';
import type { EntityKind } from './entity-kind.js';
import type { EntityScope } from './entity-scope.js';

/**
 * IDENTITY: what an entity *is and where it is addressable* — never its
 * content or state. `kind` is fixed to the literal subtype `TKind`, so a
 * `Character` (`kind: 'character'`) and a `Theme` (`kind: 'theme'`) are
 * structurally distinct types even though both extend
 * `CreativeEntityIdentity`; no subtype's construction function accepts an
 * arbitrary caller-supplied `kind`, so an entity can never misidentify
 * its own subtype.
 */
export interface CreativeEntityIdentity<TKind extends EntityKind> {
  readonly id: EntityId;
  readonly kind: TKind;
  readonly scope: EntityScope;
}

/**
 * STATE: an entity's ordinary lifecycle, kept as a distinct concern from
 * `CreativeEntityIdentity` even though every concrete entity type carries
 * both (Constitution-aligned domain modeling — see
 * `docs/architecture/creative-domain-model.md`, "Core Modeling
 * Principle").
 */
export interface CreativeEntityLifecycle {
  readonly lifecycle: LifecycleState;
}

/**
 * Shared identity+state resolution used by every concrete entity
 * subtype's construction function, so identifier generation/validation
 * and lifecycle defaulting are not reimplemented per subtype. Internal to
 * the `entity/` module — each subtype module composes this with its own
 * content validation, it is not re-exported from the package's public
 * API.
 */
export function resolveEntityIdentity<TKind extends EntityKind>(
  kind: TKind,
  input: {
    readonly id?: EntityId;
    readonly scope: EntityScope;
    readonly lifecycle?: LifecycleState;
  },
): CreativeEntityIdentity<TKind> & CreativeEntityLifecycle {
  let id: EntityId;
  if (input.id === undefined) {
    id = generateEntityId();
  } else if (isEntityId(input.id)) {
    id = input.id;
  } else {
    throw new DomainValidationError(
      'entity.id_malformed',
      `Entity id must be a valid EntityId, received: ${JSON.stringify(input.id)}.`,
      'id',
    );
  }

  return {
    id,
    kind,
    scope: input.scope,
    lifecycle: resolveLifecycleState(input.lifecycle),
  };
}
