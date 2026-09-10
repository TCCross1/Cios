import { DomainValidationError } from '@cios/domain';

/**
 * The exact, closed vocabulary describing HOW a Spark's raw source was
 * captured — never what it creatively means (Directive 005, section 9).
 * A text Spark is not automatically dialogue; an image Spark is not
 * automatically a character; a voice Spark is not automatically
 * transcribed. `SparkModality` identifies capture form only.
 *
 * No aliases, abbreviations, or additional values (e.g. `mixed`, `ai`,
 * `other`, `generated`) are permitted in Directive 005.
 */
export type SparkModality = 'text' | 'voice' | 'image' | 'link' | 'file';

const SPARK_MODALITIES: readonly SparkModality[] = ['text', 'voice', 'image', 'link', 'file'];

/** Runtime type guard for `SparkModality`. */
export function isSparkModality(value: unknown): value is SparkModality {
  return typeof value === 'string' && (SPARK_MODALITIES as readonly string[]).includes(value);
}

/**
 * Validates `raw` as a `SparkModality`. Throws {@link
 * DomainValidationError} when `raw` is not one of the exact canonical
 * literals (no synonym, abbreviation, or case variation is accepted).
 */
export function createSparkModality(raw: string): SparkModality {
  if (!isSparkModality(raw)) {
    throw new DomainValidationError(
      'spark_modality.invalid',
      `SparkModality must be one of ${SPARK_MODALITIES.map((modality) => `"${modality}"`).join(', ')}, received: ${JSON.stringify(raw)}.`,
      'modality',
    );
  }
  return raw;
}
