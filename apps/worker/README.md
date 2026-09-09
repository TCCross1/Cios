# @cios/worker

The CIOS background/long-running job runtime, separate from interactive
API request execution (Constitution, section J). Intended future home for
AI generation, media processing, rendering, analysis, ingestion, indexing,
and production-workflow jobs, and eventually the Transactional Outbox
relay/consumer described in ADR 0008.

## Status

Architecture foundation only (Directive 002). Not bound to any queue
implementation (Redis, BullMQ, Temporal, pg-boss) yet — this runtime only
proves the toolchain (dev/build/start/typecheck) operates. No jobs are
implemented.
