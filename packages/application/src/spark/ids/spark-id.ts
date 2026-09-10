import { DomainValidationError } from '@cios/domain';

declare const sparkIdBrand: unique symbol;

/**
 * Identifies exactly one {@link Spark} — an immutable raw-inspiration
 * capture. Branded (nominal) so it is never mutually assignable with
 * `@cios/domain`'s `UniverseId`/`WorkId`/`EntityId` or `@cios/provenance`'s
 * `ProvenanceId` at compile time, even though all of these are
 * structurally plain UUID v4 strings at runtime — the same discipline
 * ADR 0013 established for domain identifiers and ADR 0014 established
 * for `ProvenanceId`.
 *
 * This brand is intentionally private to `@cios/application` (a distinct
 * `unique symbol`, not shared with any other package's ID brands), so a
 * `SparkId` can never be interchanged with a domain or provenance
 * identifier even though both ultimately reduce to `string` at runtime.
 */
export type SparkId = string & { readonly [sparkIdBrand]: true };

// Strict lowercase/uppercase-tolerant UUID v4 syntax — the same
// canonical format `@cios/domain` and `@cios/provenance` use for their
// branded identifiers (ADR 0013), reimplemented privately here (rather
// than importing an internal helper from either package) so this
// module's identifier format is self-contained.
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuidV4(value: string): boolean {
  return UUID_V4_PATTERN.test(value);
}

/**
 * A minimal structural type for the portable Web Crypto UUID-generation
 * surface this module depends on — not the full DOM `Crypto` interface.
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
    | Partial<WebCryptoUuidSource>
    | undefined;
  if (candidate !== undefined && typeof candidate.randomUUID === 'function') {
    return candidate as WebCryptoUuidSource;
  }
  return undefined;
}

/** Runtime type guard for `SparkId`. */
export function isSparkId(value: unknown): value is SparkId {
  return typeof value === 'string' && isUuidV4(value);
}

/**
 * Validates `raw` as a `SparkId`. Throws {@link DomainValidationError}
 * (never returns a placeholder) when `raw` is not a syntactically valid
 * UUID v4 string.
 */
export function createSparkId(raw: string): SparkId {
  if (!isSparkId(raw)) {
    throw new DomainValidationError(
      'spark_id.malformed',
      `SparkId must be a valid UUID v4 string, received: ${JSON.stringify(raw)}.`,
      'sparkId',
    );
  }
  return raw;
}

/**
 * Generates a new, valid, randomly assigned `SparkId` via the portable
 * `globalThis.crypto.randomUUID()` Web Crypto API. Throws {@link
 * DomainValidationError} if no such implementation is available in the
 * current runtime — this deliberately never falls back to
 * `Math.random()` or any other insecure pseudo-random generator.
 */
export function generateSparkId(): SparkId {
  const webCrypto = resolveWebCrypto();
  if (webCrypto === undefined) {
    throw new DomainValidationError(
      'spark_id.crypto_unavailable',
      'A Web Crypto-compatible globalThis.crypto.randomUUID() implementation is required to generate a SparkId, but none is available in this runtime.',
      'crypto',
    );
  }
  return createSparkId(webCrypto.randomUUID());
}
