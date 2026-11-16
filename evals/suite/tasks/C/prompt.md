## Task Set C: Instructor Directory

You are working in a non-production sample codebase for an agentic coding harness evaluation.

Task Set ID: TS-C-INSTRUCTOR-DIRECTORY

Task Name: Instructor Directory

Refer to markdown requirements defining Task Set C (task-set-c-requirements.md)

### Overview

Implement a read-only instructor directory: GET /api/instructors and GET /api/instructors/{id}.

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

1. Create an Instructor model with id, name, email, department, title, and active.
2. Seed exactly the 10 instructors listed in the requirements file, with the same ids and field values.
3. Add GET /api/instructors.
4. Support q search on instructor name, case-insensitively.
5. Support department filter: engineering, data, security, design.
6. Support active filter: true or false.
7. Support page and pageSize. page defaults to 1. pageSize defaults to 10. Maximum pageSize is 50.
8. Results are ordered by name ascending.
9. Invalid query parameters must return HTTP 400 with a consistent error response.
10. Add GET /api/instructors/{id}. An unknown id returns HTTP 404 with error code INSTRUCTOR_NOT_FOUND.
11. Add tests for success, search, filters, pagination, validation failures, lookup by id, and not found.
12. Add or update instructor documentation.

Run the relevant tests, lint, and build commands if available. Provide a short summary of what changed, commands run, test results, cost/usage and any known limitations.
