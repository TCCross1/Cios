/**
 * Thrown by domain construction/validation functions when input violates a
 * deterministic domain invariant (Constitution, section F, Deterministic
 * Truth). Never thrown for AI/interpretation-dependent judgments — only for
 * mechanical facts a compiler/validator can already guarantee (malformed
 * identifiers, empty required text, invalid discriminants, self-referential
 * structures, etc.).
 *
 * `code` is a stable, machine-matchable identifier (e.g. for tests or future
 * error-mapping at a process boundary). `field` names the offending input
 * property when applicable.
 */
export class DomainValidationError extends Error {
  readonly code: string;
  readonly field?: string;

  constructor(code: string, message: string, field?: string) {
    super(message);
    this.name = 'DomainValidationError';
    this.code = code;
    if (field !== undefined) {
      this.field = field;
    }
  }
}
