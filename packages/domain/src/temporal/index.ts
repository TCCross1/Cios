/**
 * @cios/domain temporal
 *
 * `UtcTimestamp` — validated real-world ISO-8601 UTC instants.
 * `TemporalReference` — in-universe/fictional temporal knowledge,
 * independent of Gregorian/real-world chronology.
 *
 * NARRATIVE POSITION DECISION (Directive 003): a `NarrativePosition` type
 * ("when does the audience/player encounter this?", as opposed to
 * `TemporalReference`'s "when did this occur in-universe?") is
 * intentionally DEFERRED, not implemented, in this directive. A
 * meaningful narrative-position value requires an ordering concept
 * relative to some narrative container (scene, chapter, episode, act) —
 * without that container, any value type would either duplicate
 * `TemporalReference` under a different name (no real value) or force
 * this directive to prematurely define scene/chapter/episode structure,
 * which Directive 003 explicitly does not do. See
 * `docs/architecture/creative-domain-model.md` for the full rationale.
 */
export {
  type UtcTimestamp,
  isUtcTimestamp,
  createUtcTimestamp,
  nowAsUtcTimestamp,
} from './utc-timestamp.js';
export {
  type TemporalReference,
  type ExactTemporalReference,
  type TextualTemporalReference,
  type RelativeTemporalReference,
  type UnknownTemporalReference,
  createTemporalReference,
} from './temporal-reference.js';
