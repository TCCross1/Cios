/**
 * The CIOS Spark Engine (Directive 005): immutable capture of a
 * creator's raw inspiration or an imported reference, before CIOS
 * interprets, restructures, summarizes, expands, or judges it. See
 * `docs/architecture/spark-engine.md` for the full model and
 * `docs/architecture/adr/0015-*.md` for the governing decisions.
 *
 * This is the module's curated public API — internal helpers are
 * intentionally not re-exported here.
 */

// Identifiers
export { type SparkId, createSparkId, generateSparkId, isSparkId } from './ids/index.js';

// References
export { type SparkRef, createSparkRef, isSparkRef } from './references/index.js';

// Source modalities
export {
  type SparkModality,
  isSparkModality,
  createSparkModality,
  type SparkResourceRef,
  isSparkResourceRef,
  createSparkResourceRef,
  type TextSparkSource,
  type VoiceSparkSource,
  type ImageSparkSource,
  type LinkSparkSource,
  type FileSparkSource,
  type SparkSource,
  type SparkSourceInput,
  createSparkSource,
} from './source/index.js';

// Capture
export { type Spark, type CaptureSparkInput, captureSpark } from './capture/index.js';
