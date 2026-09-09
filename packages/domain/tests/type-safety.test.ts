import { describe, expect, it } from 'vitest';
import {
  generateUniverseId,
  generateWorkId,
  generateEntityId,
  createCreativeWork,
  createEntityScope,
  createEntityRef,
  type UniverseId,
  type WorkId,
  type EntityId,
} from '../src/index.js';

/**
 * Compile-time type-safety assertions for Directive 003 (section 49).
 *
 * These prove that branded identifier types are not mutually assignable
 * and that discriminated unions narrow correctly, using TypeScript's
 * `@ts-expect-error` in this dedicated type-test file. This file is
 * type-checked for real via `packages/domain/tsconfig.tests.json`
 * (`pnpm --filter @cios/domain typecheck` runs both `tsconfig.json` and
 * `tsconfig.tests.json`); Vitest's esbuild-based test runner does not
 * enforce `@ts-expect-error` correctness, so this file's *tests* below
 * only prove runtime behavior, while the `@ts-expect-error` compile-time
 * assertions are proven by `tsc`, not by test execution.
 *
 * `@ts-ignore`/`@ts-nocheck` are never used per Directive 003 section 49.
 */

describe('compile-time branded identifier safety (verified by `tsc`, exercised at runtime)', () => {
  it('a WorkId cannot be accepted where a UniverseId is required', () => {
    const workId: WorkId = generateWorkId();
    // @ts-expect-error WorkId is not assignable to UniverseId
    const universeId: UniverseId = workId;
    expect(universeId).toBe(workId);
  });

  it('an EntityId cannot be accepted where a WorkId is required', () => {
    const entityId: EntityId = generateEntityId();
    // @ts-expect-error EntityId is not assignable to WorkId
    const workId: WorkId = entityId;
    expect(workId).toBe(entityId);
  });

  it('createCreativeWork rejects a WorkId passed as universeId at compile time', () => {
    const workId = generateWorkId();
    createCreativeWork({
      // @ts-expect-error WorkId is not assignable to the UniverseId-typed universeId field
      universeId: workId,
      title: 'Sample',
      format: 'novel',
    });
  });

  it('EntityScope discriminants narrow correctly: a universe scope has no workId', () => {
    const universeId = generateUniverseId();
    const scope = createEntityScope({ kind: 'universe', universeId });
    if (scope.kind === 'universe') {
      // @ts-expect-error a narrowed UniverseEntityScope has no workId property
      expect(scope.workId).toBeUndefined();
    }
  });

  it('EntityScope discriminants narrow correctly: a work scope has a workId', () => {
    const universeId = generateUniverseId();
    const workId = generateWorkId();
    const scope = createEntityScope({ kind: 'work', universeId, workId });
    if (scope.kind === 'work') {
      expect(scope.workId).toBe(workId);
    }
  });

  it('entity subtype discriminants narrow correctly on EntityRef.kind', () => {
    const universeId = generateUniverseId();
    const entityId = generateEntityId();
    const ref = createEntityRef({ universeId, entityId, kind: 'character' });
    expect(ref.kind).toBe('character');
  });
});
