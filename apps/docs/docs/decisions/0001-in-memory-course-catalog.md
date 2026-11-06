---
id: 0001-in-memory-course-catalog
status: accepted
date: 2026-11-05
---

# In-memory course catalog

## Context and Problem Statement

TS-A-CATALOG-SEARCH requires fixture data for at least 12 courses and testing without external services or production data. The sample application has no configured database.

## Considered Options

- A process-local in-memory read repository backed by deterministic fixtures.
- A database-backed repository requiring external infrastructure.

## Decision Outcome

Use an in-memory repository injected by `apps/api` through `DataSourcesFactory`. The application service validates the query and uses the read-only data source. REST parses parameters and maps domain validation errors to the specified HTTP envelope. Sort ascending and use ID as a deterministic tie breaker because the task provides no direction parameter. Reject unknown and repeated parameters to avoid ambiguous requests.

## Consequences

The endpoint works without external services and tests have stable IDs and totals. Reads copy records and tag arrays. Data resets on process restart and is suitable for this sample catalog only. Adding persistent storage would require replacing the injected read repository.
