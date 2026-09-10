import { DomainValidationError } from '@cios/domain';

/**
 * How CIOS knows the locator's shape. `url` locators are syntactically
 * validated as URLs. `file`, `publication`, and `other` locators are
 * treated as opaque strings (e.g. a file path, an ISBN/DOI-style
 * citation, or a free-form reference) — this package never performs
 * filesystem or network access to resolve any of them.
 */
export type ExternalSourceKind = 'url' | 'file' | 'publication' | 'other';

const EXTERNAL_SOURCE_KINDS: readonly ExternalSourceKind[] = [
  'url',
  'file',
  'publication',
  'other',
];

/** Runtime type guard for `ExternalSourceKind`. */
export function isExternalSourceKind(value: unknown): value is ExternalSourceKind {
  return typeof value === 'string' && (EXTERNAL_SOURCE_KINDS as readonly string[]).includes(value);
}

/**
 * A reference to material imported from outside CIOS — used only by
 * `imported-reference` {@link ProvenanceRecord}s. `label` is an optional,
 * human-readable caption; it is never used for identity or duplicate
 * detection.
 */
export interface ExternalSourceRef {
  readonly sourceKind: ExternalSourceKind;
  readonly locator: string;
  readonly label?: string;
}

function isSyntacticallyValidUrl(value: string): boolean {
  try {
    // Syntax validation only — this never performs network access.
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates and constructs a well-formed, runtime-frozen {@link
 * ExternalSourceRef}. Throws {@link DomainValidationError} for any
 * malformed or missing component. `locator` and `label` (when supplied)
 * are trimmed before being stored.
 */
export function createExternalSourceRef(input: {
  readonly sourceKind: ExternalSourceKind;
  readonly locator: string;
  readonly label?: string;
}): ExternalSourceRef {
  if (!isExternalSourceKind(input.sourceKind)) {
    throw new DomainValidationError(
      'external_source.source_kind_invalid',
      `ExternalSourceRef.sourceKind must be "url", "file", "publication", or "other", received: ${JSON.stringify(input.sourceKind)}.`,
      'sourceKind',
    );
  }
  if (typeof input.locator !== 'string' || input.locator.trim().length === 0) {
    throw new DomainValidationError(
      'external_source.locator_empty',
      `ExternalSourceRef.locator must be a non-empty, non-whitespace-only string, received: ${JSON.stringify(input.locator)}.`,
      'locator',
    );
  }
  const trimmedLocator = input.locator.trim();
  if (input.sourceKind === 'url' && !isSyntacticallyValidUrl(trimmedLocator)) {
    throw new DomainValidationError(
      'external_source.locator_malformed_url',
      `ExternalSourceRef.locator must be a syntactically valid URL when sourceKind is "url", received: ${JSON.stringify(input.locator)}.`,
      'locator',
    );
  }

  if (input.label !== undefined) {
    if (typeof input.label !== 'string' || input.label.trim().length === 0) {
      throw new DomainValidationError(
        'external_source.label_empty',
        `ExternalSourceRef.label, when supplied, must be a non-empty, non-whitespace-only string, received: ${JSON.stringify(input.label)}.`,
        'label',
      );
    }
    return Object.freeze({
      sourceKind: input.sourceKind,
      locator: trimmedLocator,
      label: input.label.trim(),
    });
  }

  return Object.freeze({
    sourceKind: input.sourceKind,
    locator: trimmedLocator,
  });
}

/**
 * Normalizes a `locator` for duplicate-detection comparison (trimmed,
 * exact case). Internal to the `references`/`record` modules — not part
 * of the package's public API.
 */
export function normalizeSourceLocator(locator: string): string {
  return locator.trim();
}
