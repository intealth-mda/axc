## Task Set L: Enrollment Request Status History CSV Export

You are working in a non-production sample codebase for an agentic coding harness evaluation.

Task Set ID: TS-L-STATUS-HISTORY-CSV

Task Name: Enrollment Request Status History CSV Export

Refer to markdown requirements defining Task Set L (task-set-l-requirements.md)

### Overview

Add an endpoint that exports one enrollment request's status history as a CSV file.

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

1. Add GET /api/enrollment-requests/:id/history.csv.
2. Respond with HTTP 200, Content-Type text/csv; charset=utf-8, and Content-Disposition attachment; filename="enrollment-request-<id>-history.csv".
3. The first line is the header row changedAt,fromStatus,toStatus,changedBy,reason.
4. Add one row per statusHistory entry, in statusHistory order (oldest first), including the creation entry.
5. Write null values as empty fields.
6. Quote a field in double quotes only when it contains a comma, a double quote, a carriage return, or a line feed, and double any double quote inside it.
7. End every line, including the last, with CRLF.
8. Return HTTP 404 with code ENROLLMENT_REQUEST_NOT_FOUND in the existing JSON error format for an unknown id.
9. Keep all existing endpoints and responses unchanged.
10. Add tests for the header, row order, empty fields, quoting, line endings, response headers, and the unknown id.
11. Update the enrollment requests documentation for the new endpoint.
12. Existing tests must still pass.

Run the relevant tests, lint, and build commands if available. Provide a short summary of what changed, commands run, test results, cost/usage and any known limitations.
