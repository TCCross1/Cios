/**
 * @cios/application
 *
 * Use-case orchestration across domain concerns. The application layer coordinates domain, creative-graph, and provenance operations, and is the intended home for the future proposal-acceptance use case that transitions AI proposals into canonical state (ADR 0006). It must not import web frameworks, database drivers, or provider SDKs directly (Constitution, section G, U).
 *
 * Directive 005 implements the first real application-layer workflow:
 * the Spark Engine — immutable capture of a creator's raw inspiration or
 * an imported reference. See `docs/architecture/spark-engine.md` for the
 * full model and `docs/architecture/adr/0015-*.md` for the governing
 * decisions.
 *
 * This is the package's curated public API — internal module-local
 * helpers are intentionally not re-exported here, so consumers depend on
 * stable, deliberate surface area rather than deep imports into
 * implementation modules.
 *
 * Directive 005 intentionally does NOT implement: the Interpretation
 * Engine, the Canon Ledger, the Creation Graph engine, transcription,
 * OCR, embeddings, AI invocation/providers, persistence/repositories/
 * database, product API/UI, authentication, billing, Production Studios,
 * or the Adaptation Engine.
 */

// Spark Engine
export {
  type SparkId,
  createSparkId,
  generateSparkId,
  isSparkId,
  type SparkRef,
  createSparkRef,
  isSparkRef,
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
  type Spark,
  type CaptureSparkInput,
  captureSpark,
} from './spark/index.js';
