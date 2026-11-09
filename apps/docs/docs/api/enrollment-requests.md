# Enrollment request API

The sample API stores enrollment requests in memory for the lifetime of its API worker. Restarting the worker resets requests. There is no database or real authentication. changedBy is a caller-supplied audit label, not a verified identity.

## Create

`POST /api/enrollment-requests`

```json
{
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course for my upcoming secure development work."
}
```

201 Created returns an EnrollmentRequest:

```json
{
  "id": "enroll-unique-id",
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course for my upcoming secure development work.",
  "status": "pending",
  "createdAt": "2026-06-27T10:00:00.000Z",
  "updatedAt": "2026-06-27T10:00:00.000Z",
  "statusHistory": [{
    "fromStatus": null,
    "toStatus": "pending",
    "changedAt": "2026-06-27T10:00:00.000Z",
    "changedBy": "system",
    "reason": null
  }]
}
```

The course must exist and be active. Email is trimmed and lowercased before validation and duplicate comparison. Justification is trimmed and must contain 20–500 characters. Creation always establishes pending status and its initial audit entry. Caller-supplied id, status, timestamps and history are ignored. A learner/course pair may have only one pending or approved request; rejected or cancelled requests permit a new submission. Concurrent writes are serialized within this worker.

## Retrieve

`GET /api/enrollment-requests/:id`

Returns 200 with the full EnrollmentRequest above, including the complete statusHistory, or 404 if absent.

## List and filter

`GET /api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=learner@example.org`

Returns 200 with an array of complete EnrollmentRequest objects, or `[]` if none match. Each filter is optional and combined with AND. status accepts pending, approved, rejected, cancelled. courseId is an exact match; learnerEmail is normalized as on creation. With no filters all requests are returned in insertion order. There is no pagination. Invalid, blank, repeated, or unknown query parameters return 400 INVALID_REQUEST.

## Change status

`PATCH /api/enrollment-requests/:id/status`

Approval body:

```json
{ "status": "approved", "changedBy": "reviewer@example.org" }
```

Rejection body:

```json
{ "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Prerequisite course is missing." }
```

Returns 200 with the complete updated EnrollmentRequest. id, courseId, learnerEmail, justification and createdAt are preserved; status and updatedAt change, and exactly one audit entry is appended with fromStatus, toStatus, changedAt equal to updatedAt, changedBy and reason (null when omitted). changedBy must be a non-empty string. Rejection requires a non-empty reason. Optional reasons on other transitions must also be non-empty strings when supplied.

Allowed transitions:

| From | To |
| --- | --- |
| pending | approved, rejected, cancelled |
| approved | cancelled |

Rejected and cancelled are terminal. Repeating a status is an invalid transition. Invalid commands leave state and history unchanged. The route id takes precedence over any body id. JSON objects are required; malformed JSON returns 400.

## Errors

All errors use this envelope; details is an array and may be empty for record-level conflicts:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "justification must be between 20 and 500 characters.",
    "details": [{ "field": "justification", "message": "justification must be between 20 and 500 characters." }]
  }
}
```

| Scenario | HTTP status | Code |
| --- | --- | --- |
| Course missing on creation | 404 | COURSE_NOT_FOUND |
| Course draft or retired | 409 | COURSE_NOT_ACTIVE |
| Invalid email, justification, body or required field | 400 | INVALID_REQUEST |
| Duplicate pending or approved request | 409 | DUPLICATE_ACTIVE_REQUEST |
| Request missing on retrieve or status change | 404 | ENROLLMENT_REQUEST_NOT_FOUND |
| Invalid status value | 400 | INVALID_REQUEST |
| Invalid transition | 409 | INVALID_STATUS_TRANSITION |
| Rejection without a non-empty reason | 400 | INVALID_REQUEST |
| Invalid list filters | 400 | INVALID_REQUEST |
| Unexpected internal failure | 500 | INTERNAL_ERROR |

Email validation checks common address syntax, not mailbox existence or deliverability. This sample is not durable and does not coordinate multiple workers.
