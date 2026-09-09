/**
 * Shared identifier-format rule for all CIOS branded domain identifiers.
 * Internal to the `ids/` module — not part of the package's public API.
 *
 * CIOS identifiers are canonical, lowercase, hyphenated UUID version 4
 * strings (RFC 4122). This is a deliberate, deterministic, easily
 * validated format with no external generation dependency: Node's built-in
 * `crypto.randomUUID()` already produces conforming values, so no
 * additional runtime dependency is needed (see the ADR on identifier
 * strategy for the full rationale).
 */
const UUID_V4_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True when `value` is a syntactically valid UUID v4 string. */
export function isUuidV4(value: string): boolean {
  return UUID_V4_PATTERN.test(value);
}
