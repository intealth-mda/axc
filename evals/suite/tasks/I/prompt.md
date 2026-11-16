## Task Set I: Course Search Sort Direction

You are working in a non-production sample codebase for an agentic coding harness evaluation.

Task Set ID: TS-I-COURSE-SORT-DIRECTION

Task Name: Course Search Sort Direction

Refer to markdown requirements defining Task Set I (task-set-i-requirements.md)

### Overview

Extend the existing GET /api/courses sort parameter so every sort field can be sorted in descending order with a `-` prefix, for example sort=-createdAt.

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

1. Accept sort values title, createdAt, and updatedAt (ascending) and -title, -createdAt, and -updatedAt (descending).
2. Keep ascending order when there is no prefix. The default sort stays title ascending.
3. Apply sorting before pagination, and keep it working with every filter.
4. Return HTTP 400 with code INVALID_QUERY_PARAMETER and a details entry for the sort field for any other sort value, including -unknown, -, and --title.
5. Do not change the course seed data or the response shape.
6. Add tests for each descending sort, the unchanged ascending sorts, descending sort with pagination, and invalid sort values.
7. Update the courses documentation to describe the descending prefix with the example sort=-createdAt.
8. Existing tests must still pass.

Run the relevant tests, lint, and build commands if available. Provide a short summary of what changed, commands run, test results, cost/usage and any known limitations.
