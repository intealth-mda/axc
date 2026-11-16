## Task Set H: API Error Code Reference

You are working in a non-production sample codebase for an agentic coding harness evaluation.

Task Set ID: TS-H-ERROR-CODE-REFERENCE

Task Name: API Error Code Reference

Refer to markdown requirements defining Task Set H (task-set-h-requirements.md)

### Overview

Add an "Error codes" reference page to the documentation site that lists every error code the API can return, with its HTTP status, its meaning, and the endpoints that return it.

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

1. Add the page apps/docs/docs/error-codes.md with the title "Error codes".
2. Document the shared error response body once on that page, with a JSON example.
3. List every error code the API returns, one table row per code, with the columns Code, HTTP status, Meaning, and Endpoints.
4. Take each HTTP status, meaning, and endpoint list from the application source, not from assumptions.
5. Register the page in the documentation sidebar, keeping the existing pages.
6. Do not change API behavior. The API must keep returning each documented code with the documented status.
7. The documentation site build must still pass.
8. Existing tests must still pass.

Run the relevant tests, lint, and build commands if available. Provide a short summary of what changed, commands run, test results, cost/usage and any known limitations.
