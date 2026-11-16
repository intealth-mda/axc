## Task Set D: Learning Resources Library

You are working in a non-production sample codebase for an agentic coding harness evaluation.

Task Set ID: TS-D-RESOURCE-LIBRARY

Task Name: Learning Resources Library

Refer to markdown requirements defining Task Set D (task-set-d-requirements.md)

### Overview

Implement a learning resources library: POST /api/resources, GET /api/resources, and GET /api/resources/{id}.

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

1. Create a Resource model with id, title, url, type, tags, and createdAt.
2. The library starts empty when the API starts.
3. Add POST /api/resources. A valid request returns HTTP 201 with the created resource.
4. title is required and must be 3 to 120 characters after trimming.
5. url is required and must be an absolute URL using https.
6. type is required and must be one of article, video, course, tool.
7. tags is optional, holds 0 to 5 tags, and each tag must be 1 to 30 characters. Tags are stored trimmed and lowercased.
8. Invalid request bodies must return HTTP 400 with error code INVALID_REQUEST and one details entry per invalid field. Nothing is stored.
9. Add GET /api/resources with optional type and tag filters. tag matches case-insensitively. An invalid type filter returns HTTP 400.
10. Add GET /api/resources/{id}. An unknown id returns HTTP 404 with error code RESOURCE_NOT_FOUND.
11. Add tests for creation, each validation rule, retrieval, filtering, and not found.
12. Add or update resources documentation.

Run the relevant tests, lint, and build commands if available. Provide a short summary of what changed, commands run, test results, cost/usage and any known limitations.
