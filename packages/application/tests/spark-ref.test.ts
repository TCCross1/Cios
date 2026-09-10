import { describe, expect, it } from 'vitest';
import { createSparkRef, isSparkRef } from '../src/spark/references/spark-ref.js';
import { generateSparkId } from '../src/spark/ids/spark-id.js';
import { generateUniverseId, DomainValidationError } from '@cios/domain';

describe('SparkRef', () => {
  it('constructs a valid, frozen SparkRef', () => {
    const universeId = generateUniverseId();
    const sparkId = generateSparkId();
    const ref = createSparkRef({ universeId, sparkId });
    expect(ref).toEqual({ universeId, sparkId });
    expect(Object.isFrozen(ref)).toBe(true);
  });

  it('rejects a malformed universeId', () => {
    expect(() =>
      createSparkRef({ universeId: 'not-a-universe-id' as never, sparkId: generateSparkId() }),
    ).toThrow(DomainValidationError);
  });

  it('rejects a malformed sparkId', () => {
    expect(() =>
      createSparkRef({ universeId: generateUniverseId(), sparkId: 'not-a-spark-id' as never }),
    ).toThrow(DomainValidationError);
  });

  it('cannot be mutated after creation', () => {
    const ref = createSparkRef({ universeId: generateUniverseId(), sparkId: generateSparkId() });
    expect(() => {
      // @ts-expect-error SparkRef.sparkId is readonly at compile time too
      ref.sparkId = generateSparkId();
    }).toThrow(TypeError);
  });

  it('round-trips through JSON as a stable plain-data shape with exactly universeId + sparkId', () => {
    const universeId = generateUniverseId();
    const sparkId = generateSparkId();
    const ref = createSparkRef({ universeId, sparkId });
    const roundTripped = JSON.parse(JSON.stringify(ref));
    expect(roundTripped).toEqual({ universeId, sparkId });
    expect(Object.keys(roundTripped).sort()).toEqual(['sparkId', 'universeId']);
  });

  it('isSparkRef is a true runtime guard', () => {
    const ref = createSparkRef({ universeId: generateUniverseId(), sparkId: generateSparkId() });
    expect(isSparkRef(ref)).toBe(true);
    expect(isSparkRef({ universeId: generateUniverseId() })).toBe(false);
    expect(isSparkRef(null)).toBe(false);
    expect(isSparkRef('not-an-object')).toBe(false);
  });
});
