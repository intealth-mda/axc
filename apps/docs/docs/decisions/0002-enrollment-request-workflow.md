---
title: Record enrollment requests in memory
---

# Record enrollment requests in memory

## Context and Problem Statement

Learners need to request enrollment in an active course. Reviewers need to approve, reject, or cancel a request, and every creation or status change needs a `statusHistory` entry. The sample API already serves `GET /api/courses` from an in-memory catalog. Enrollment requests must follow the same layering and must run in unit tests and in the Azure Functions acceptance host without a database download.

## Decision Drivers

- A request can be created only for an existing `active` course.
- A learner can hold only one `pending` or `approved` request for a course.
- Status changes are a fixed set: `pending` to `approved`, `rejected`, or `cancelled`, and `approved` to `cancelled`.
- Invalid input is HTTP 400, a missing course or request is HTTP 404, and a conflict is HTTP 409.
- Domain code must stay free of Hono, Azure Functions, and Mongoose.

## Considered Options

1. Keep the course catalog as it is. Add an `EnrollmentRequest` model in `@axc/domain`, an in-memory store in `@axc/persistence`, and the workflow in `@axc/application-services`. `@axc/rest` maps the four routes. `@apps/api` registers those routes on the existing Hono handler.
2. Store requests in Mongoose through `@axc/service-mongoose`.
3. Put the transition rules in the Hono route.

## Decision Outcome

Chosen option 1. `EnrollmentRequest.open` starts a `pending` request and writes the first history entry. `transition` allows only the four supported moves and returns a new entity. The in-memory store checks for an active duplicate in the same turn as the insert, so two creates in one process cannot both win. The application service turns domain and catalog results into the HTTP error codes. The course search path is untouched.

Option 2 stays available if requests later need to survive a restart. Option 3 would hide the transition rules from the service tests.

## Consequences

- Requests disappear when the process stops. Ids start again at `enroll-001`.
- The duplicate rule is per process, not per machine or per user account. There is no authentication; `changedBy` is the id the caller sends, and creation is attributed to `system`.
- `learnerEmail` is trimmed and matched case-insensitively. `justification` length uses the raw string.
- Rejection without a non-empty `reason` is HTTP 400 and does not change the request. An illegal transition is HTTP 409 and does not append history.
- List results are the full filtered set, ordered by `createdAt` then `id`. Unknown query parameters are HTTP 400.
