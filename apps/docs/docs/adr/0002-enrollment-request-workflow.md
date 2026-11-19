# Keep enrollment requests in the sample process

## Context and Problem Statement

Learners need to request enrollment in an active course, and reviewers need to approve, reject, or cancel those requests. The workflow has validation, duplicate prevention, a fixed set of status transitions, and a status history entry for every creation and change. The API process still has no database connection string, and the feature has to be testable without an external service.

## Decision Drivers

* The EnrollmentRequest sheet is the field source. Task Set B is the behavior source: active course, email, justification length, duplicate pending or approved requests, and the transition table.
* `GET /api/courses` already serves the in-memory course catalog and must keep doing so.
* Domain code stays free of Hono and Mongoose.
* Existing health and course tests stay in place.

## Considered Options

* Store requests only in a Mongoose `enrollmentrequests` collection and require MongoDB for the route.
* Store live requests in the application process, and keep the Mongoose model, seed, and repositories for a later database connection.

## Decision Outcome

Chosen option: "Store live requests in the application process, and keep the Mongoose model, seed, and repositories for a later database connection", because the functions host has no configured database and the workflow must answer without an external service.

The EnrollmentRequest aggregate enforces email length, justification length, status values, and history entries. The application service checks that the course exists and is active, blocks a second pending or approved request for the same learner and course, and checks the transition table. Query validation stays in the Hono route. The sheet opens `statusHistory` with `{` while its data type says `array`. The API contract is a list of entries, so the property is a value array and each change appends one entry.

`factory.json` is not in this repo. The new files use the same Types context and `@axc` package roots as Course.

### Consequences

* Good, because create, read, list, and status changes run in the same Hono app as course search, with no network service.
* Good, because tests cover validation, duplicates, filters, transitions, history, and errors, and course search is unchanged.
* Bad, because requests live in process memory. A restart clears them. The Mongoose collection is not what the route reads today.
* Bad, because the Mongoose `courseId` is an ObjectId, while the sample catalog ids are strings such as `course-001`. The live store keeps the catalog string.

## Confirmation

`packages/axc/rest` requests the enrollment routes and `GET /api/courses` against the composed application service.
