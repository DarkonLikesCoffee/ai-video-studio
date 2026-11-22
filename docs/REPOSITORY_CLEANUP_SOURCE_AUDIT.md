# Source-code cleanup audit — 2026-11-22

## Scope

A source-level follow-up after PR #125, focused on concrete duplication with existing behavior and tests. This change is intentionally limited to the shared retry-delay calculation used by the Wikimedia Commons and NASA video asset downloaders.

## Repository inventory

The recursive Git tree on the post-PR #125 main commit contained 186 tracked files: 6 under `apps/`, 24 under `packages/`, 33 under `scripts/`, 34 under `tests/`, 44 under `projects/`, 10 under `agent/`, 3 under `docs/`, and 2 under `schemas/`. The tree response was complete (not truncated).

## Finding: duplicated HTTP retry-delay algorithm

Both `scripts/commons-video-assets.mjs` and `scripts/nasa-video-assets.mjs` independently parsed numeric and HTTP-date `Retry-After` values, clamped retry delays, and computed exponential backoff.

Their policies are not identical and remain distinct:
- Wikimedia Commons: minimum Retry-After 1 second, maximum 120 seconds, exponential base 2 seconds, backoff cap 30 seconds.
- NASA: minimum Retry-After 1 second, maximum 60 seconds, exponential base 1 second, backoff cap 15 seconds.

## Change

- Added `scripts/retry-delay.mjs` with one pure shared calculation.
- Kept `getHttpRetryDelayMs` and `getNasaRetryDelayMs` as provider-specific wrappers, preserving their existing exports and settings.
- Left the HTTP request loops, timeout policies, retry counts, cancellation behavior, headers, URL validation and download logic unchanged.
- Added direct unit tests for Retry-After seconds, HTTP-date parsing, provider-specific clamps, exponential backoff and invalid-header fallback.
- Existing tests for both downloader exports remain in place.

## Explicitly not changed

- No dependencies, npm scripts, render workflows, production compositions or source assets were changed.
- No supposedly unused modules were removed. The candidate utility files inspected (`animation.ts`, `footage.ts`, `narration.ts`, `narration-timeline.ts`, `svg-path.ts` and `transitions.ts`) are referenced by production code/tests. `EiffelTower.tsx` is imported by `EiffelScene.tsx`; it is not orphaned.
- No package lockfile was present in the tracked repository tree, so dependency removal remains deferred until dependency installation can be made reproducible and audited.

## Verification

- Existing Commons and NASA retry tests exercise their public wrapper functions.
- New tests exercise the common helper and verify both provider policies.
- GitHub Actions CI must pass on this PR before merge. This connector-only session does not run a local install, test suite or build.
