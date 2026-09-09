/**
 * @cios/domain location
 *
 * Foundational `Location` — identity/name/description/parentLocationId
 * only, with the local self-parent invariant enforced. No GIS, no full
 * hierarchy-cycle detection (requires graph/repository context).
 */
export { type Location, type CreateLocationInput, createLocation } from './location.js';
