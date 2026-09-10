import type { EntityScope, UniverseId, UtcTimestamp } from '@cios/domain';
import type { ProvenanceRef } from '@cios/provenance';
import type { SparkId } from '../ids/spark-id.js';
import type { SparkSource } from '../source/spark-source.js';

/**
 * An immutable capture of a creator's raw inspiration or an imported
 * reference, before CIOS interprets, restructures, summarizes, expands,
 * or judges it (Directive 005, section 1). Deliberately contains no
 * `updatedAt`, `lifecycleState`, `title`, `summary`, `interpretation`,
 * `tags`, `embedding`, Canon/authority state, entity-graph identity, or
 * arbitrary metadata bag — a `Spark` is immutable source evidence, not a
 * mutable resource, not a `CreativeEntity`, and not Canon (Directive 005,
 * sections 3, 4, and 18).
 *
 * `Spark` stores only a {@link ProvenanceRef} — never the full {@link
 * ProvenanceRecord} it was captured with — preserving the
 * subjectless-provenance architecture certified by Directive 004
 * (Directive 005, section 20).
 */
export interface Spark {
  readonly sparkId: SparkId;
  readonly universeId: UniverseId;
  readonly scope: EntityScope;
  readonly provenanceRef: ProvenanceRef;
  readonly capturedAt: UtcTimestamp;
  readonly source: SparkSource;
}
