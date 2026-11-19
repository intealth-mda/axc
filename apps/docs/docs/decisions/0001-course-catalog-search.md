---
title: Use an in-memory course catalog
---

# Use an in-memory course catalog

## Context and Problem Statement

The sample API needs `GET /api/courses` with keyword search, filters, pagination, and sorting. The catalog must be testable without production data or an external service. MongoDB is available through `@axc/service-mongoose`, and `mongodb-memory-server-core` can start a local server, but that server downloads a database binary and is more machinery than a 15-course fixture needs.

## Decision Drivers

- The endpoint must run in unit tests and in the Azure Functions acceptance host.
- Domain code must stay free of Hono, Azure Functions, and Mongoose.
- The fixture must include every modality, status, and a mix of tags.
- Invalid queries need one error shape.

## Considered Options

1. Seed an in-memory `CourseCatalog` from `@axc/persistence` and search it in `@axc/application-services`.
2. Store courses in Mongoose and query them with MongoDB.
3. Filter a hard-coded array inside the Hono route.

## Decision Outcome

Chosen option 1. `@axc/domain` defines the `Course` model and the fixture. `@axc/persistence` builds the seeded catalog. `@axc/application-services` parses the query and pages the result. `@axc/rest` maps that result to HTTP. `@apps/api` registers `GET /api/courses` on the existing Hono handler.

Option 2 stays available for a later durable catalog. Option 3 would bypass the application service and make the route hard to test without HTTP.

## Consequences

- The catalog resets when the process starts and is the same 15 courses in every environment.
- Keyword search is a case-insensitive substring. Tag search is a case-insensitive exact match.
- `modality`, `status`, and `sort` are case-sensitive. Unknown query parameters return HTTP 400.
- A blank `q` is ignored. A page past the end returns HTTP 200 with an empty `items` array.
- `totalPages` is `0` when nothing matches. Sort order is ascending, with `id` as the tie-break.
