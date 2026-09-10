import { DomainValidationError } from '../errors/domain-validation-error.js';

/**
 * Shared identifier-format rule for all CIOS branded domain identifiers.
 * Internal to the `ids/` module — not part of the package's public API.
 *
 * CIOS identifiers are canonical, lowercase, hyphenated UUID version 4
 * strings (RFC 4122). This is a deliberate, deterministic, easily
 * validated format with no external generation dependency (see ADR 0013
 * for the full rationale).
 */
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True when `value` is a syntactically valid UUID v4 string. */
export function isUuidV4(value: string): boolean {
  return UUID_V4_PATTERN.test(value);
}

/**
 * A minimal structural type for the portable Web Crypto UUID-generation
 * surface CIOS depends on — not the full DOM `Crypto` interface. This
 * package's `lib` does not include `"dom"`, and `@cios/domain` must
 * remain runtime/framework independent (Directive 003R, section 13), so
 * this file does not statically import `node:crypto`; instead it reads
 * `globalThis.crypto` at call time through this narrow shape, which is
 * satisfied by Node.js (>=19), browsers, and other modern JS runtimes
 * alike without any Node-only module import.
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

/**
 * Generates a new, valid, randomly assigned UUID v4 string via the
 * portable `globalThis.crypto.randomUUID()` Web Crypto API. Throws
 * {@link DomainValidationError} if no such implementation is available in
 * the current runtime — this deliberately never falls back to
 * `Math.random()` or any other insecure pseudo-random generator, per
 * Directive 003R section 13.
 */
export function generateUuidV4(): string {
  const webCrypto = resolveWebCrypto();
  if (webCrypto === undefined) {
    throw new DomainValidationError(
      'id_format.crypto_unavailable',
      'A Web Crypto-compatible globalThis.crypto.randomUUID() implementation is required to generate CIOS identifiers, but none is available in this runtime.',
      'crypto',
    );
  }
  return webCrypto.randomUUID();
}
