## Task Set F: Course Tag Filter Case Bug

You are working in a non-production sample codebase for an agentic coding harness evaluation.

Task Set ID: TS-F-TAG-FILTER-CASE

Task Name: Course Tag Filter Case Bug

Refer to markdown requirements defining Task Set F (task-set-f-requirements.md)

### Overview

Investigate and fix a reported bug in the course search endpoint GET /api/courses: the tag filter returns no courses when the tag is sent in a different letter case than it is stored.

Use only the allowed write boundary:

- apps/api/** rest routing / functional wiring
- packages/cellix/** can continue to port over packages from github repo CellixJS/cellixjs; these vendored packages should **NEVER** deviate from the original source repository
- packages/axc/rest/** hono logic
- packages/axc/application-services/** application services
- packages/axc/persistence/** data storage
- packages/axc/service-mongoose/** data storage
- packages/axc/** do not create any additional directories beyond what already exist
- packages/axc-verification/** unit, integration, architectural and acceptance tests
- apps/docs/** any configuration necessary to get documentation functional
- apps/docs/ ** MADR / API documentation

Do not modify authentication, production configuration, deployment pipelines, secrets, environment files, unrelated domains, or external integrations. Do not add dependencies unless clearly justified.

### Requirements:

1. Reproduce the reported bug: GET /api/courses?tag=AI returns no courses, while GET /api/courses?tag=ai returns the courses tagged ai.
2. Add a regression test that fails on the current code and passes after the fix.
3. Fix the root cause so the tag filter matches case-insensitively, as the courses documentation already states.
4. Keep the tag filter an exact tag match. A partial tag must not match.
5. Keep keyword search, the modality and status filters, pagination, sorting, and query validation unchanged.
6. Do not change the course seed data or the response shape.
7. Existing tests must still pass.

Run the relevant tests, lint, and build commands if available. Provide a short summary of what changed, commands run, test results, cost/usage and any known limitations.
