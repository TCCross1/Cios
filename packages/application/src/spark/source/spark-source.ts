import { DomainValidationError } from '@cios/domain';
import { isSparkModality, type SparkModality } from './spark-modality.js';
import { createSparkResourceRef, type SparkResourceRef } from './spark-resource-ref.js';

/**
 * A creator's raw text fragment — dialogue, a sentence, a world idea, an
 * unexplained fragment, etc. `content` is preserved byte-for-code-unit
 * exactly as supplied: leading/trailing whitespace, multiple spaces,
 * tabs, line breaks, punctuation, quotation marks, Unicode, and emoji
 * are never normalized (Directive 005, section 11).
 */
export interface TextSparkSource {
  readonly modality: 'text';
  readonly content: string;
}

/** A raw voice-memo capture, referenced opaquely (Directive 005, section 13). */
export interface VoiceSparkSource {
  readonly modality: 'voice';
  readonly resourceRef: SparkResourceRef;
}

/** A raw image/photograph capture, referenced opaquely (Directive 005, section 14). */
export interface ImageSparkSource {
  readonly modality: 'image';
  readonly resourceRef: SparkResourceRef;
}

/**
 * A normal web reference. `url` is preserved exactly as supplied — only
 * validated against a trimmed view (Directive 005, section 16).
 */
export interface LinkSparkSource {
  readonly modality: 'link';
  readonly url: string;
}

/** A raw file capture, referenced opaquely (Directive 005, section 15). */
export interface FileSparkSource {
  readonly modality: 'file';
  readonly resourceRef: SparkResourceRef;
}

/**
 * One atomic raw-capture payload for a {@link Spark}, discriminated by
 * {@link SparkModality}. A Spark has exactly one `SparkSource` — never an
 * array — so one source atom always has one clear, unambiguous
 * provenance relationship (Directive 005, section 8).
 */
export type SparkSource =
  | TextSparkSource
  | VoiceSparkSource
  | ImageSparkSource
  | LinkSparkSource
  | FileSparkSource;

/** Discriminated input shapes accepted by {@link createSparkSource}. */
export type SparkSourceInput =
  | { readonly modality: 'text'; readonly content: string }
  | { readonly modality: 'voice'; readonly resourceRef: string }
  | { readonly modality: 'image'; readonly resourceRef: string }
  | { readonly modality: 'link'; readonly url: string }
  | { readonly modality: 'file'; readonly resourceRef: string };

const ERROR_SCOPE = 'spark_source';

// Absolute URL protocols accepted for `LinkSparkSource.url`. Mirrors the
// already-certified `@cios/provenance` `ExternalSourceRef` `url`-scheme
// policy (ADR 0014/Directive 004R): only `http:`/`https:`, checked by
// exact parsed `.protocol` — never a `startsWith`-style prefix check.
// `@cios/provenance` does not export this check (it is internal to
// `references/external-source-ref.ts`), so it is reimplemented here
// rather than reached via a deep import, matching the same
// self-contained-reimplementation pattern `@cios/provenance` itself used
// for `@cios/domain`'s UUID-format helper.
const ALLOWED_URL_PROTOCOLS: ReadonlySet<string> = new Set(['http:', 'https:']);

function hasAllowedUrlProtocol(value: string): boolean {
  try {
    return ALLOWED_URL_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}

function createTextSparkSource(content: string): TextSparkSource {
  if (typeof content !== 'string' || content.trim().length === 0) {
    throw new DomainValidationError(
      `${ERROR_SCOPE}.text_content_empty`,
      `TextSparkSource.content must be a non-empty, non-whitespace-only string, received: ${JSON.stringify(content)}.`,
      'content',
    );
  }
  // The exact original string is stored — never trimmed or otherwise
  // normalized (Directive 005, section 11 and 29).
  return Object.freeze({ modality: 'text', content });
}

function createVoiceSparkSource(resourceRef: string): VoiceSparkSource {
  return Object.freeze({ modality: 'voice', resourceRef: createSparkResourceRef(resourceRef) });
}

function createImageSparkSource(resourceRef: string): ImageSparkSource {
  return Object.freeze({ modality: 'image', resourceRef: createSparkResourceRef(resourceRef) });
}

function createFileSparkSource(resourceRef: string): FileSparkSource {
  return Object.freeze({ modality: 'file', resourceRef: createSparkResourceRef(resourceRef) });
}

function createLinkSparkSource(url: string): LinkSparkSource {
  if (typeof url !== 'string' || url.trim().length === 0) {
    throw new DomainValidationError(
      `${ERROR_SCOPE}.link_url_empty`,
      `LinkSparkSource.url must be a non-empty, non-whitespace-only string, received: ${JSON.stringify(url)}.`,
      'url',
    );
  }
  // Validation inspects a trimmed view only — the exact original
  // user-supplied string is what gets stored (Directive 005, sections 16
  // and 30).
  if (!hasAllowedUrlProtocol(url.trim())) {
    throw new DomainValidationError(
      `${ERROR_SCOPE}.link_url_malformed`,
      `LinkSparkSource.url must be an absolute "http:" or "https:" URL, received: ${JSON.stringify(url)}.`,
      'url',
    );
  }
  return Object.freeze({ modality: 'link', url });
}

/**
 * Validates and constructs a well-formed, runtime-frozen {@link
 * SparkSource}. Throws {@link DomainValidationError} for an unrecognized
 * discriminant or a malformed/missing component. Defensively
 * constructed: the returned value is a fresh object, never the caller's
 * own input object, so later mutation of caller-owned input cannot alter
 * an already-constructed `SparkSource` (Directive 005, section 17).
 */
export function createSparkSource(input: SparkSourceInput): SparkSource {
  if (!isSparkModality((input as { readonly modality?: unknown }).modality)) {
    throw new DomainValidationError(
      `${ERROR_SCOPE}.modality_invalid`,
      `SparkSource.modality must be one of "text", "voice", "image", "link", or "file", received: ${JSON.stringify((input as { readonly modality?: unknown }).modality)}.`,
      'modality',
    );
  }

  const modality: SparkModality = input.modality;
  switch (modality) {
    case 'text':
      return createTextSparkSource((input as { readonly content: string }).content);
    case 'voice':
      return createVoiceSparkSource((input as { readonly resourceRef: string }).resourceRef);
    case 'image':
      return createImageSparkSource((input as { readonly resourceRef: string }).resourceRef);
    case 'link':
      return createLinkSparkSource((input as { readonly url: string }).url);
    case 'file':
      return createFileSparkSource((input as { readonly resourceRef: string }).resourceRef);
    default: {
      const unreachable: never = modality;
      throw new DomainValidationError(
        `${ERROR_SCOPE}.modality_unreachable`,
        `Unrecognized SparkModality: ${JSON.stringify(unreachable as unknown)}.`,
        'modality',
      );
    }
  }
}
