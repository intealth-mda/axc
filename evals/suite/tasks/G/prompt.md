## Task Set G: Mask Learner Emails in Enrollment Request Lists

You are working in a non-production sample codebase for an agentic coding harness evaluation.

Task Set ID: TS-G-ENROLLMENT-EMAIL-MASKING

Task Name: Mask Learner Emails in Enrollment Request Lists

Refer to markdown requirements defining Task Set G (task-set-g-requirements.md)

### Overview

GET /api/enrollment-requests currently returns every learner's full email address to any caller. Mask learner email addresses in list results, except when the caller filters by that learner's email.

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

1. In GET /api/enrollment-requests responses, mask each item's learnerEmail as the first character of the address, then `***`, then `@` and the unchanged domain (learner@example.org becomes l***@example.org).
2. Mask in every list response, including lists filtered by status or courseId.
3. When the request includes the learnerEmail query parameter, return the matching items with their full stored learnerEmail. The learnerEmail filter keeps matching case-insensitively.
4. Masking applies to responses only. Stored data, filtering, and duplicate prevention keep using the full address.
5. POST /api/enrollment-requests, GET /api/enrollment-requests/:id, and PATCH /api/enrollment-requests/:id/status keep returning the full learnerEmail.
6. All other fields and all existing validation and error behavior are unchanged.
7. Add tests for masked lists, the learnerEmail filter exception, the mask format, and the unchanged endpoints.
8. Update the enrollment requests documentation to describe the masking rule.
9. Existing tests must still pass.

Run the relevant tests, lint, and build commands if available. Provide a short summary of what changed, commands run, test results, cost/usage and any known limitations.
