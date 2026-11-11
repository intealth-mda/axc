# Serve course search from the catalog aggregate

## Status

Accepted

## Context

Callers need `GET /api/courses` with keyword search, modality, status, and tag filters, plus pagination and sort. The API must stay testable without production data or external services.

## Decision

Model `Course` as a catalog aggregate. Seed twelve courses in the persistence memory Mongo started with `createMemoryMongoServer()`. The application service reads them through `readonlyDataSource`, applies filters, then sorts and pages. REST validates the query string and returns `INVALID_QUERY_PARAMETER` for invalid values.

## Consequences

The catalog lives in process memory and is seeded on first read. Sort is ascending only. Authentication is unchanged. Adding a write command would introduce a catalog unit of work, which this read endpoint does not need.
