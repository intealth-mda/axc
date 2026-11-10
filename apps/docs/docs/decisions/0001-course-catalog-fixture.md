# Use a fixture-backed course catalog

## Status

Accepted

## Context

The course catalog search endpoint must be testable without production data or an external service. Callers need keyword search, modality, status, and tag filters, plus paging and sorting. Invalid query parameters need one error shape.

The domain model is a read-only Course aggregate. The task does not authorize catalog writes.

## Decision

Seed 14 courses in `@axc/persistence` and search them through the Course repository. `@axc/application-services` validates the query and maps repository results to the HTTP page. `@axc/rest` exposes `GET /api/courses`. `@apps/api` registers that route on the existing anonymous Hono handler.

Sort order is ascending on `title`, `createdAt`, or `updatedAt`, with `id` as a tie-break. Enum filters are case-sensitive. Keyword and tag matches are case-insensitive. `totalPages` is 0 when no course matches.

## Consequences

The endpoint returns the same fixture in every environment, including local and acceptance tests. `save` on the course repository rejects writes. Replacing the fixture with MongoDB later can keep the Course repository and the HTTP contract.
