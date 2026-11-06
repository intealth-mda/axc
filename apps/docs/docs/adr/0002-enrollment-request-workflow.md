# Keep enrollment requests in an in-memory workflow

* Status: accepted
* Date: 2026-11-06

## Context and Problem Statement

Learners need to request enrollment in an active course, and reviewers need to approve, reject, or cancel those requests. The workflow has validation, duplicate prevention, a fixed set of status transitions, and an audit trail. Course search from the catalog endpoint must keep working. The sample already separates domain, application services, persistence, and Hono delivery, and it does not use a database for the catalog.

## Decision Drivers

* Create, read, list, and status changes must be testable without an external service.
* Domain code must stay free of Hono, Azure Functions, and Mongoose.
* Duplicate `pending` and `approved` requests must be blocked for the same learner and course.
* Every creation and status change needs a `statusHistory` entry.
* Invalid input and illegal transitions need different HTTP statuses.
* A MongoDB process would add startup cost for a sample workflow that does not need to survive a restart.

## Considered Options

* Model `EnrollmentRequest` in `@axc/domain`, enforce the workflow in `@axc/application-services`, and store requests in an in-memory adapter in `@axc/persistence`.
* Store requests in MongoDB through `@axc/service-mongoose`.
* Put validation and transition rules in the Hono route.

## Decision Outcome

Chosen option: "Model `EnrollmentRequest` in `@axc/domain`, enforce the workflow in `@axc/application-services`, and store requests in an in-memory adapter in `@axc/persistence`."

`EnrollmentRequest` is a domain entity. It always starts as `pending` and records the initial history entry. `withStatus` appends history and refuses a transition outside the allowed set. The application service checks the course, the email, the justification, the duplicate rule, and the rejection reason, then maps those failures to HTTP 400, 404, or 409. The store assigns `enroll-001` style ids and rejects a second active insert for the same learner and course. `@axc/rest` parses JSON and query strings and returns the service status. `@apps/api` injects the seeded course catalog and one process-local store, and registers the enrollment routes next to `GET /api/courses`.

`@axc/service-mongoose` stays the Mongoose extension point and is not on this path.

### Consequences

* Good, because unit tests do not start a database.
* Good, because transition and audit rules live with the entity and the use case.
* Good, because course search stays on the existing catalog port.
* Bad, because requests disappear when the process stops.
* Bad, because a later durable adapter must implement the same `EnrollmentRequestStore` port.

## Pros and Cons of the Options

### In-memory store behind the domain port

* Good, because the sample stays free of external services.
* Good, because the composition root can inject the store.
* Bad, because it is not a durable store.

### MongoDB memory server

* Good, because it would exercise Mongoose.
* Bad, because the Functions host would wait on a database before serving enrollment routes.
* Bad, because the workflow rules do not require a database.

### Rules inside the Hono route

* Good, because fewer types would cross the route boundary.
* Bad, because validation, duplicates, and history would be harder to test without HTTP.
* Bad, because the route would own the request data.

## More Information

The HTTP contract is documented in [Enrollment requests](../enrollment-requests). Course search remains documented in [Course catalog](../courses).
