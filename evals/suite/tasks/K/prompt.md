## Task Set K: Bulk Enrollment Request Status Change

You are working in a non-production sample codebase for an agentic coding harness evaluation.

Task Set ID: TS-K-BULK-STATUS-CHANGE

Task Name: Bulk Enrollment Request Status Change

Refer to markdown requirements defining Task Set K (task-set-k-requirements.md)

### Overview

The codebase already implements course search (GET /api/courses) and the enrollment request workflow (/api/enrollment-requests). Add an all-or-nothing bulk status change for enrollment requests.

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

1. Add POST /api/enrollment-requests/bulk-status with body ids, status, changedBy, and optional reason.
2. ids must hold 1 to 50 distinct request ids. status, changedBy, and reason follow the same rules as the single status change.
3. Invalid bodies return HTTP 400 with error code INVALID_REQUEST.
4. The change is all-or-nothing. If any id does not exist or any transition is invalid, no request changes.
5. A failed bulk change returns HTTP 409 with error code BULK_STATUS_CHANGE_FAILED and lists every failing id with its own error code.
6. On success every request moves to the new status, gets its own statusHistory entry, and the response returns all updated requests.
7. The single-request status change and all other existing behavior must not change.
8. Add tests for a successful bulk change, audit entries, validation failures, missing ids, invalid transitions, the full failure list, and the all-or-nothing guarantee.
9. Add or update enrollment request documentation.
10. Existing tests must still pass.

Run the relevant tests, lint, and build commands if available. Provide a short summary of what changed, commands run, test results, cost/usage and any known limitations.
