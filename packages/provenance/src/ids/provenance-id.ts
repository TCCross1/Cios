import { DomainValidationError } from '@cios/domain';

declare const provenanceIdBrand: unique symbol;

/**
 * Identifies exactly one {@link ProvenanceRecord} lineage node. Branded
 * (nominal) so it is never mutually assignable with `@cios/domain`'s
 * `UniverseId`, `WorkId`, or `EntityId` at compile time, even though all
 * of these are structurally plain UUID v4 strings at runtime — the same
 * discipline established by Directive 003/ADR 0013 for domain
 * identifiers.
 *
 * This brand is intentionally private to `@cios/provenance` (a distinct
 * `unique symbol`, not shared with `@cios/domain`'s ID brands), so a
 * `ProvenanceId` and a domain ID can never be interchanged even though
 * both ultimately reduce to `string` at runtime.
 */
export type ProvenanceId = string & { readonly [provenanceIdBrand]: true };

// Strict lowercase/uppercase-tolerant UUID v4 syntax. Deliberately the
// same canonical format `@cios/domain` uses for its branded identifiers
// (ADR 0013) so provenance and domain identifiers are visually and
// structurally consistent, without importing `@cios/domain`'s internal,
// unexported `ids/id-format.ts` helpers.
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuidV4(value: string): boolean {
  return UUID_V4_PATTERN.test(value);
}

/**
 * A minimal structural type for the portable Web Crypto UUID-generation
 * surface this package depends on — not the full DOM `Crypto` interface.
 * Read from `globalThis.crypto` at call time so the same code runs
 * unmodified under Node.js (>=19), browsers, and other modern JavaScript
 * runtimes that implement Web Crypto, with no static `node:crypto`
 * import anywhere in this package.
 */
interface WebCryptoUuidSource {
  readonly randomUUID: () => string;
}

function resolveWebCrypto(): WebCryptoUuidSource | undefined {
  const candidate = (globalThis as { readonly crypto?: unknown }).crypto as
    Partial<WebCryptoUuidSource> | undefined;
  if (candidate !== undefined && typeof candidate.randomUUID === 'function') {
    return candidate as WebCryptoUuidSource;
  }
  return undefined;
}

/** Runtime type guard for `ProvenanceId`. */
export function isProvenanceId(value: unknown): value is ProvenanceId {
  return typeof value === 'string' && isUuidV4(value);
}

/**
 * Validates `raw` as a `ProvenanceId`. Throws {@link DomainValidationError}
 * (never returns a placeholder) when `raw` is not a syntactically valid
 * UUID v4 string.
 */
export function createProvenanceId(raw: string): ProvenanceId {
  if (!isProvenanceId(raw)) {
    throw new DomainValidationError(
      'provenance_id.malformed',
      `ProvenanceId must be a valid UUID v4 string, received: ${JSON.stringify(raw)}.`,
      'provenanceId',
    );
  }
  return raw;
}

/**
 * Generates a new, valid, randomly assigned `ProvenanceId` via the
 * portable `globalThis.crypto.randomUUID()` Web Crypto API. Throws
 * {@link DomainValidationError} if no such implementation is available in
 * the current runtime — this deliberately never falls back to
 * `Math.random()` or any other insecure pseudo-random generator.
 */
export function generateProvenanceId(): ProvenanceId {
  const webCrypto = resolveWebCrypto();
  if (webCrypto === undefined) {
    throw new DomainValidationError(
      'provenance_id.crypto_unavailable',
      'A Web Crypto-compatible globalThis.crypto.randomUUID() implementation is required to generate a ProvenanceId, but none is available in this runtime.',
      'crypto',
    );
  }
  return createProvenanceId(webCrypto.randomUUID());
}
