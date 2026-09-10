import { DomainValidationError } from '../errors/domain-validation-error.js';
import { isUniverseId, type UniverseId } from '../ids/universe-id.js';
import { isWorkId, type WorkId } from '../ids/work-id.js';

/**
 * An entity belongs to an entire {@link CreativeUniverse} (visible/usable
 * across every work in it — e.g. a setting-wide Concept or Rule).
 */
export interface UniverseEntityScope {
  readonly kind: 'universe';
  readonly universeId: UniverseId;
}

/**
 * An entity belongs to one specific {@link CreativeWork} within a
 * universe (e.g. a character who only appears in one film of a shared
 * universe). `universeId` is included alongside `workId` — not merely
 * `workId` alone — so a work-scoped entity's universe is always known
 * without a lookup/join, matching {@link EntityRef}'s isolation reasoning
 * (see `docs/architecture/creative-domain-model.md`).
 */
export interface WorkEntityScope {
  readonly kind: 'work';
  readonly universeId: UniverseId;
  readonly workId: WorkId;
}

/**
 * The addressability boundary of a creative entity: universe-wide, or
 * scoped to one specific work within a universe. A discriminated union —
 * never a single object with an optional `workId` — so "work scope
 * without a work" is unrepresentable.
 */
export type EntityScope = UniverseEntityScope | WorkEntityScope;

/**
 * Validates and normalizes `input` into a well-formed, runtime-frozen
 * {@link EntityScope}. Throws {@link DomainValidationError} for an
 * unrecognized discriminant or a malformed/missing identifier component
 * (never silently drops one).
 */
export function createEntityScope(
  input:
    | { readonly kind: 'universe'; readonly universeId: UniverseId }
    | { readonly kind: 'work'; readonly universeId: UniverseId; readonly workId: WorkId },
): EntityScope {
  if (!isUniverseId(input.universeId)) {
    throw new DomainValidationError(
      'entity_scope.universe_id_malformed',
      `EntityScope.universeId must be a valid UniverseId, received: ${JSON.stringify(input.universeId)}.`,
      'universeId',
    );
  }

  switch (input.kind) {
    case 'universe':
      return Object.freeze({ kind: 'universe', universeId: input.universeId });
    case 'work': {
      if (!isWorkId(input.workId)) {
        throw new DomainValidationError(
          'entity_scope.work_id_malformed',
          `Work-scoped EntityScope requires a valid WorkId, received: ${JSON.stringify(input.workId)}.`,
          'workId',
        );
      }
      return Object.freeze({ kind: 'work', universeId: input.universeId, workId: input.workId });
    }
    default: {
      const unreachable: never = input;
      throw new DomainValidationError(
        'entity_scope.invalid_discriminant',
        `Unrecognized entity scope kind: ${JSON.stringify((unreachable as { kind: unknown }).kind)}.`,
        'kind',
      );
    }
  }
}
