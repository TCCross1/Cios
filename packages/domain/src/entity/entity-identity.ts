import { generateEntityId, isEntityId, type EntityId } from '../ids/entity-id.js';
import { DomainValidationError } from '../errors/domain-validation-error.js';
import { resolveLifecycleState, type LifecycleState } from '../lifecycle/lifecycle-state.js';
import { resolveTimestampPair } from '../temporal/resolve-timestamp-pair.js';
import type { UtcTimestamp } from '../temporal/utc-timestamp.js';
import type { UniverseId } from '../ids/universe-id.js';
import type { EntityKind } from './entity-kind.js';
import type { EntityScope } from './entity-scope.js';

/**
 * IDENTITY: what an entity *is and where it is addressable* — never its
 * content or state. `entityKind` is fixed to the literal subtype
 * `TKind`, so a `Character` (`entityKind: 'character'`) and a `Theme`
 * (`entityKind: 'theme'`) are structurally distinct types even though
 * both extend `CreativeEntityIdentity`; no subtype's construction
 * function accepts an arbitrary caller-supplied `entityKind`, so an
 * entity can never misidentify its own subtype.
 *
 * `universeId` is exposed as a top-level field in addition to
 * `scope.universeId` (Directive 003R, section 7): the caller supplies
 * only `scope`, and `universeId` is deterministically *derived* from
 * `scope.universeId` — there is no separate, independently suppliable
 * `universeId` input, so the two can never contradict each other.
 *
 * `displayName` is every entity's canonical, generic display string
 * (Directive 003R, section 8), always derived from the same normalized
 * value a subtype uses for its own semantic field (`Character.name`,
 * `CreativeEvent.title`, ...) — never an independently suppliable value.
 */
export interface CreativeEntityIdentity<TKind extends EntityKind> {
  readonly entityId: EntityId;
  readonly universeId: UniverseId;
  readonly entityKind: TKind;
  readonly scope: EntityScope;
  readonly displayName: string;
}

/**
 * STATE: an entity's ordinary lifecycle and audit timestamps, kept as a
 * distinct concern from `CreativeEntityIdentity` even though every
 * concrete entity type carries both (Constitution-aligned domain
 * modeling — see `docs/architecture/creative-domain-model.md`, "Core
 * Modeling Principle"). `createdAt`/`updatedAt` live here (not on
 * `CreativeEntityIdentity`) because they describe the entity's state
 * over time, not its address/identity.
 */
export interface CreativeEntityLifecycle {
  readonly lifecycleState: LifecycleState;
  readonly createdAt: UtcTimestamp;
  readonly updatedAt: UtcTimestamp;
}

/**
 * Shared identity+state resolution used by every concrete entity
 * subtype's construction function, so identifier generation/validation,
 * lifecycle defaulting, and createdAt/updatedAt resolution are not
 * reimplemented per subtype (Directive 003R, section 9). Internal to the
 * `entity/` module — each subtype module composes this with its own
 * content validation and supplies its already-resolved `displayName`; it
 * is not re-exported from the package's public API.
 */
export function resolveEntityIdentity<TKind extends EntityKind>(
  kind: TKind,
  input: {
    readonly id?: EntityId;
    readonly scope: EntityScope;
    readonly lifecycleState?: LifecycleState;
    readonly createdAt?: UtcTimestamp | string;
    readonly updatedAt?: UtcTimestamp | string;
    readonly displayName: string;
  },
): CreativeEntityIdentity<TKind> & CreativeEntityLifecycle {
  let entityId: EntityId;
  if (input.id === undefined) {
    entityId = generateEntityId();
  } else if (isEntityId(input.id)) {
    entityId = input.id;
  } else {
    throw new DomainValidationError(
      'entity.id_malformed',
      `Entity id must be a valid EntityId, received: ${JSON.stringify(input.id)}.`,
      'id',
    );
  }

  const { createdAt, updatedAt } = resolveTimestampPair(input, 'entity');

  // Defensively copy + freeze the caller-supplied scope so it cannot be
  // mutated (directly, or via a reference the caller retained) after
  // this entity is constructed (Directive 003R, section 12).
  const scope = Object.freeze({ ...input.scope }) as EntityScope;

  return Object.freeze({
    entityId,
    universeId: scope.universeId,
    entityKind: kind,
    scope,
    displayName: input.displayName,
    lifecycleState: resolveLifecycleState(input.lifecycleState),
    createdAt,
    updatedAt,
  });
}
