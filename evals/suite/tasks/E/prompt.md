## Task Set E: Course Capacity

You are working in a non-production sample codebase for an agentic coding harness evaluation.

Task Set ID: TS-E-COURSE-CAPACITY

Task Name: Course Capacity

Refer to markdown requirements defining Task Set E (task-set-e-requirements.md)

### Overview

The codebase already implements course search (GET /api/courses) and the enrollment request workflow (/api/enrollment-requests). Add a seat capacity to courses, an availability endpoint, and a rule that stops approvals once a course is full.

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

1. Add a capacity field to Course. Set each seeded course's capacity to the value listed in the requirements file.
2. Every course returned by GET /api/courses includes capacity.
3. Add GET /api/courses/{id}/availability returning courseId, capacity, approvedCount, pendingCount, and seatsLeft.
4. approvedCount counts approved requests for the course, pendingCount counts pending requests, and seatsLeft is capacity minus approvedCount, never below 0.
5. An unknown course id returns HTTP 404 with error code COURSE_NOT_FOUND.
6. Approving a request (PATCH status approved) when the course has no seats left returns HTTP 409 with error code COURSE_FULL and leaves the request unchanged.
7. Cancelling an approved request frees its seat.
8. Capacity limits approvals only. Creating, rejecting, and cancelling requests behave exactly as before, including for a full course.
9. Existing course search and enrollment request behavior must not change.
10. Add tests for capacity on courses, availability counts, the full-course rule, seat release on cancellation, and not found.
11. Add or update course and enrollment request documentation.
12. Existing tests must still pass.

Run the relevant tests, lint, and build commands if available. Provide a short summary of what changed, commands run, test results, cost/usage and any known limitations.
