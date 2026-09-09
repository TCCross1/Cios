/**
 * @cios/domain universe
 *
 * `CreativeUniverse` — the top-level creative container. Foundational
 * identity/content/state only; Sparks, Canon, and Creation Graph
 * relationships are later systems, not modeled here.
 */
export {
  type CreativeUniverse,
  type CreateCreativeUniverseInput,
  createCreativeUniverse,
} from './creative-universe.js';
