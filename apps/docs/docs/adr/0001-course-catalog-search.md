# Course catalog search is a read model over fixture courses

## Status

Accepted

## Context

The training catalog needs `GET /api/courses` with keyword search, modality, status, and tag filters, pagination, and sorting. The sample API must stay testable without an external database or production data. The endpoint is read-only.

## Decision

Model `Course` in the catalog domain. Keep the 12 fixture courses in `@axc/persistence` and search them through `readonlyDataSource`. Validate query strings in the course application service and return `INVALID_QUERY_PARAMETER` for invalid `modality`, `status`, `page`, `pageSize`, or `sort`. Register `GET /api/courses` on the existing Hono app.

Sort `title`, `createdAt`, and `updatedAt` in ascending order. An empty match is HTTP 200 with `totalPages` of 0.

## Consequences

- Filters and page bounds are covered by application-service tests and acceptance scenarios `A-AC1` through `A-AC9`.
- Replacing the fixture with another store means implementing `CourseReadStore.search` without changing the HTTP contract.
- The endpoint does not create or update courses, and it does not change authentication.
