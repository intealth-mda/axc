# Serve course search from a seeded in-memory catalog

## Context and Problem Statement

The training catalog needs `GET /api/courses` with keyword search, modality, status, and tag filters, pagination, sorting, and a consistent 400 for invalid query parameters. The endpoint must be testable without external services or production data.

## Decision Drivers

- The sample application already composes HTTP through Hono and application services.
- Cellix keeps domain logic free of Hono, Mongoose, and other `@axc` packages.
- The catalog is a fixed fixture. The endpoint does not create or update courses.
- Acceptance tests must run without a database process.

## Considered Options

- Store the seed in an application-service array and filter it in the route.
- Load the seed through `createMemoryMongoServer()` and a Mongoose model.
- Keep a pure catalog search in the domain, seed the courses in persistence, and parse query parameters in the application service.

## Decision Outcome

Chosen option: "pure catalog search in the domain, seed in persistence". `MemoryCourseRepository` builds course aggregates from `COURSE_SEED` on each request. `searchCourseCatalog` applies filters, ascending sort, and pagination. `searchCourses` rejects invalid query parameters before that search runs. `@axc/rest` maps `InvalidCourseQueryError` to HTTP 400.

The application service does not keep a course array. REST does not import persistence.

## Consequences

- Tests can assert a stable 13-course fixture, including case-insensitive keyword and tag matches.
- Restarting the process restores the seed. There is no write API.
- Sort order is ascending code-point order, which matches chronological order for the ISO-8601 timestamps in the seed.
- A later write model can replace the memory repository without changing the HTTP contract.
