import { DomainValidationError } from '@cios/domain';

declare const sparkResourceRefBrand: unique symbol;

/**
 * An opaque, stable reference supplied by a future storage/capture
 * boundary — used by voice/image/file {@link SparkSource} variants
 * (Directive 005, section 12). This is a technical locator, not creative
 * content: `@cios/application` never interprets it as a filesystem path,
 * checks file existence, accesses a filesystem, fetches content,
 * generates object-storage URLs, or inspects bytes. The actual storage
 * system is deferred to a later directive.
 *
 * Branded (nominal) so it is not casually interchangeable with an
 * arbitrary `string`.
 */
export type SparkResourceRef = string & { readonly [sparkResourceRefBrand]: true };

/**
 * Runtime type guard for `SparkResourceRef`: a non-empty,
 * non-whitespace-only string.
 */
export function isSparkResourceRef(value: unknown): value is SparkResourceRef {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates and normalizes `raw` as a `SparkResourceRef`. Throws {@link
 * DomainValidationError} when `raw` is empty or whitespace-only.
 * Surrounding whitespace is trimmed — this is a technical locator, not
 * creator-original creative content, so normalizing incidental
 * whitespace does not violate the Directive 005 raw-preservation
 * invariant that applies to text/link content.
 */
export function createSparkResourceRef(raw: string): SparkResourceRef {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new DomainValidationError(
      'spark_resource_ref.empty',
      `SparkResourceRef must be a non-empty, non-whitespace-only string, received: ${JSON.stringify(raw)}.`,
      'resourceRef',
    );
  }
  return raw.trim() as SparkResourceRef;
}
