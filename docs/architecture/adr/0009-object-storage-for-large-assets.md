# 0009. Object Storage for Large Creative Assets

## Status

Accepted (design intent only — not implemented)

## Context

CIOS creative universes will include large binary assets: images, audio,
video, project exports, generated media, and source binaries. Storing
these directly in PostgreSQL is technically possible but operationally
poor (backup size/time, replication cost, connection/memory pressure,
poor fit for streaming/CDN delivery).

## Decision

- **PostgreSQL** stores the authoritative asset **record**: metadata,
  relationships, versions, provenance, permissions, and a reference
  (key/URL) to the underlying binary.
- **S3-compatible object storage** stores the binary content itself:
  images, audio, video, project exports, large documents, generated media,
  source binaries.

Object storage is never treated as the metadata authority — the database
row is the source of truth for what an asset _is_ and how it relates to
the rest of canonical state; object storage only holds the bytes. No
object storage integration is implemented in Directive 002.

## Consequences

- Deleting/replacing a binary must always go through the domain/
  application layer that keeps the database record and the object-storage
  content consistent — never a direct storage-only operation.
- Asset lineage (which version of which asset, produced by what process)
  lives in the same versioned-state + provenance model as the rest of
  canonical state (ADR 0007), not as filenames or storage-path
  conventions.
- Any S3-compatible provider (AWS S3, Cloudflare R2, MinIO for local/dev,
  etc.) can be used behind an infrastructure adapter without changing the
  domain model, because the domain only knows about an asset record and a
  reference, not a specific provider SDK.

## Alternatives Considered

- **Store binaries as PostgreSQL `bytea`/large objects**: rejected as the
  default — explicitly called out as something to avoid "unless a future
  documented exception requires it"; poor operational fit for large media
  at scale.
- **Store binaries on local filesystem**: rejected for production — not
  durable/replicated across environments; acceptable only as a local
  development convenience behind the same adapter interface, not as the
  architecture's target.

## What Would Justify Revisiting

- A specific, small, frequently-joined binary (e.g. a tiny icon) where
  colocating with its metadata row demonstrably simplifies a real
  workflow — would be a narrow, documented exception, not a reversal of
  this default.
