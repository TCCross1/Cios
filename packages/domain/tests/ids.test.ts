import { describe, expect, it } from 'vitest';
import {
  createUniverseId,
  generateUniverseId,
  isUniverseId,
  createWorkId,
  generateWorkId,
  isWorkId,
  createEntityId,
  generateEntityId,
  isEntityId,
  DomainValidationError,
} from '../src/index.js';

describe('UniverseId', () => {
  it('accepts a syntactically valid UUID v4', () => {
    const id = createUniverseId('11111111-1111-4111-8111-111111111111');
    expect(isUniverseId(id)).toBe(true);
  });

  it('generates a valid, unique id', () => {
    const a = generateUniverseId();
    const b = generateUniverseId();
    expect(isUniverseId(a)).toBe(true);
    expect(a).not.toBe(b);
  });

  it('rejects a malformed id', () => {
    expect(() => createUniverseId('not-a-uuid')).toThrow(DomainValidationError);
    expect(() => createUniverseId('11111111-1111-1111-8111-111111111111')).toThrow(
      DomainValidationError,
    );
  });
});

describe('WorkId', () => {
  it('accepts a syntactically valid UUID v4', () => {
    const id = createWorkId('22222222-2222-4222-8222-222222222222');
    expect(isWorkId(id)).toBe(true);
  });

  it('generates a valid, unique id', () => {
    const a = generateWorkId();
    const b = generateWorkId();
    expect(isWorkId(a)).toBe(true);
    expect(a).not.toBe(b);
  });

  it('rejects a malformed id', () => {
    expect(() => createWorkId('')).toThrow(DomainValidationError);
  });
});

describe('EntityId', () => {
  it('accepts a syntactically valid UUID v4', () => {
    const id = createEntityId('33333333-3333-4333-8333-333333333333');
    expect(isEntityId(id)).toBe(true);
  });

  it('generates a valid, unique id', () => {
    const a = generateEntityId();
    const b = generateEntityId();
    expect(isEntityId(a)).toBe(true);
    expect(a).not.toBe(b);
  });

  it('rejects a malformed id', () => {
    expect(() => createEntityId('12345')).toThrow(DomainValidationError);
  });

  it('rejects a non-string value via the runtime guard', () => {
    expect(isEntityId(12345)).toBe(false);
    expect(isEntityId(null)).toBe(false);
    expect(isEntityId(undefined)).toBe(false);
  });
});
