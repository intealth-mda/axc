# Enrollment requests

Enrollment requests use the course catalog and a process-local in-memory store. Requests survive HTTP requests within one API process and reset when it restarts. IDs are generated as `enroll-<UUID>`. This sample has no authentication; changedBy is a caller-supplied audit label, not verified identity.

## Create

`POST /api/enrollment-requests`

```json
{
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work."
}
```

Only existing active courses accept enrollment. Email is trimmed, lowercased, and checked for email format; justification is trimmed and must contain 20–500 characters. Unknown body fields are rejected. Status and history are server-owned. Case variants of the same email identify the same learner.

Success: HTTP 201, with `Location: /api/enrollment-requests/{id}` and the full record:

```json
{
  "id": "enroll-5efab55c-1dc8-4e1a-a14b-574fcf1efc48",
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work.",
  "status": "pending",
  "createdAt": "2026-06-27T10:00:00.000Z",
  "updatedAt": "2026-06-27T10:00:00.000Z",
  "statusHistory": [
    {"fromStatus": null, "toStatus": "pending", "changedAt": "2026-06-27T10:00:00.000Z", "changedBy": "system", "reason": null}
  ]
}
```

A learner may have at most one pending or approved request for a course. Concurrent creations are serialized and checked during save. Rejected or cancelled requests permit a new request; changing status on an existing request never reopens it.

## Retrieve by ID

`GET /api/enrollment-requests/{id}` returns HTTP 200 and the full record shown above, including all statusHistory entries. A missing ID returns HTTP 404.

## List and filter

```http
GET /api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=learner@example.org
```

All filters are optional and combine with AND. Status accepts pending, approved, rejected, cancelled. CourseId matches exactly; learnerEmail uses normalized equality. Unknown, repeated, invalid, or empty filter parameters return 400. Results follow creation order and are not paginated.

HTTP 200:

```json
{"items": []}
```

Each matching item is the full record described above. An empty result is successful.

## Change status

`PATCH /api/enrollment-requests/{id}/status`

Approval:

```json
{"status": "approved", "changedBy": "reviewer@example.org"}
```

Rejection:

```json
{"status": "rejected", "changedBy": "reviewer@example.org", "reason": "Learner has not completed the prerequisite course."}
```

Cancellation uses status cancelled with a non-empty changedBy. Reason is an optional string except rejection, where trimmed reason must be non-empty. ChangedBy is a non-empty operator label. Unknown fields and an id in the body return 400.

| From | Permitted next statuses |
| --- | --- |
| pending | approved, rejected, cancelled |
| approved | cancelled |
| rejected | None |
| cancelled | None |

Repeated or backward transitions return 409. Success returns HTTP 200 and the full updated record. The id, courseId, learnerEmail, justification, and createdAt stay the same. UpdatedAt changes to the transition timestamp, and a history entry is appended atomically:

```json
{
  "fromStatus": "pending",
  "toStatus": "approved",
  "changedAt": "2026-06-27T11:00:00.000Z",
  "changedBy": "reviewer@example.org",
  "reason": null
}
```

Failed mutations leave both status and history unchanged.

## Errors

All errors use the same envelope as course search. JSON bodies must be objects; malformed JSON, arrays, null, and invalid field types return 400.

| HTTP | Code | Condition |
| --- | --- | --- |
| 400 | INVALID_REQUEST | Invalid email, justification, status, changedBy, reason, body, or list filters |
| 404 | COURSE_NOT_FOUND | Creation references an unknown course |
| 409 | COURSE_NOT_ACTIVE | Creation references a draft or retired course |
| 409 | DUPLICATE_ACTIVE_REQUEST | Same learner/course already has a pending or approved request |
| 404 | ENROLLMENT_REQUEST_NOT_FOUND | Retrieve or update references an unknown request |
| 409 | INVALID_STATUS_TRANSITION | Transition is not permitted |
| 500 | INTERNAL_ERROR | Unexpected failure; internal details are concealed |

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request could not be completed.",
    "details": [{"field": "justification", "message": "justification must be between 20 and 500 characters."}]
  }
}
```

## Sample limitations

Storage and uniqueness apply to one process, with no durability or multi-instance coordination. The typed Mongoose storage schemas are provided for architecture alignment and tested without a database connection. Internal workspace dependencies connect domain, persistence, application, and API layers; no new third-party library is needed. The root dependency lockfile is outside this task's write boundary.
