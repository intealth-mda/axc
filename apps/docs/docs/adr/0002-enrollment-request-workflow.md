# Record enrollment requests on a catalog aggregate

## Status

Accepted

## Context

Learners need to request an active course, and reviewers need to approve, reject, or cancel that request. The workflow must block a second pending or approved request for the same learner and course, and it must keep a status history. Course search from the catalog endpoint must keep working. The sample API still has no authentication and no external mailbox.

## Decision

Model `EnrollmentRequest` as a catalog aggregate with a unit of work. Persistence stores it in the same memory Mongo as courses. Application services create and update through `domainDataSource.enrollmentRequest.withScopedTransaction`, and reads go through `readonlyDataSource`. REST exposes create, list, get by id, and status patch under `/api/enrollment-requests`. Creation writes a `pending` history entry with `changedBy` `system`. A status change appends another entry. Rejection requires a reason. Invalid transitions return `409`.

## Consequences

Ids are `enroll-` plus a count of stored requests, so they are unique for a single process and are not reused after a restart of a fresh memory store. `changedBy` is recorded as supplied. The memory store is shared by requests in one API process. Cancelled and rejected requests do not count as active duplicates.
