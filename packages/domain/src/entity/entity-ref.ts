import { DomainValidationError } from '../errors/domain-validation-error.js';
import { isUniverseId, type UniverseId } from '../ids/universe-id.js';
import { isEntityId, type EntityId } from '../ids/entity-id.js';
import { isEntityKind, type EntityKind } from './entity-kind.js';

/**
 * An addressable pointer to a creative entity, usable across process/
 * serialization boundaries without embedding the full entity. `universeId`
 * is always included alongside `entityId` — even though `EntityId` is
 * already globally unique — for defense-in-depth isolation: consumers can
 * reject a reference whose `universeId` does not match the universe they
 * are currently operating in without needing to resolve `entityId` first,
 * preventing an entity reference from one universe being silently
 * followed while operating inside a different one.
 */
export interface EntityRef {
  readonly universeId: UniverseId;
  readonly entityId: EntityId;
  readonly entityKind: EntityKind;
}

/**
 * Validates and constructs a well-formed, runtime-frozen {@link
 * EntityRef}. Throws {@link DomainValidationError} for any malformed or
 * missing component (never silently drops one).
 */
export function createEntityRef(input: {
  readonly universeId: UniverseId;
  readonly entityId: EntityId;
  readonly entityKind: EntityKind;
}): EntityRef {
  if (!isUniverseId(input.universeId)) {
    throw new DomainValidationError(
      'entity_ref.universe_id_malformed',
      `EntityRef.universeId must be a valid UniverseId, received: ${JSON.stringify(input.universeId)}.`,
      'universeId',
    );
  }
  if (!isEntityId(input.entityId)) {
    throw new DomainValidationError(
      'entity_ref.entity_id_malformed',
      `EntityRef.entityId must be a valid EntityId, received: ${JSON.stringify(input.entityId)}.`,
      'entityId',
    );
  }
  if (!isEntityKind(input.entityKind)) {
    throw new DomainValidationError(
      'entity_ref.entity_kind_invalid',
      `EntityRef.entityKind must be a supported EntityKind, received: ${JSON.stringify(input.entityKind)}.`,
      'entityKind',
    );
  }

  return Object.freeze({
    universeId: input.universeId,
    entityId: input.entityId,
    entityKind: input.entityKind,
  });
}
