---
id: enrollment-requests
title: Enrollment requests
---

# Enrollment requests

A learner asks to enroll in an active course; reviewers approve, reject or cancel. Data is in memory and resets on restart.

## EnrollmentRequest

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | UUID |
| `courseId` | string | Existing course with status `active` |
| `learnerEmail` | string | Valid email, stored lower-case |
| `justification` | string | 20–500 characters |
| `status` | string | `pending`, `approved`, `rejected`, `cancelled` |
| `createdAt`, `updatedAt` | string | ISO date |
| `statusHistory` | array | `{ fromStatus, toStatus, changedAt, changedBy, reason }`; first entry has `fromStatus: null`, `changedBy: "system"` |

## `POST /api/enrollment-requests`

```json
{
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work."
}
```

`201` with the new request, `status: "pending"` and one history entry:

```json
{
  "id": "6f1c…",
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work.",
  "status": "pending",
  "createdAt": "2026-06-27T10:00:00.000Z",
  "updatedAt": "2026-06-27T10:00:00.000Z",
  "statusHistory": [
    { "fromStatus": null, "toStatus": "pending", "changedAt": "2026-06-27T10:00:00.000Z", "changedBy": "system", "reason": null }
  ]
}
```

A learner may hold only one `pending` or `approved` request per course.

## `GET /api/enrollment-requests/{id}`

`200` with the request (including `statusHistory`), or `404`.

## `GET /api/enrollment-requests`

Optional filters `status`, `courseId`, `learnerEmail` (case-insensitive). `200` with `{ "items": [ … ] }`.

```bash
curl 'http://localhost:7071/api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=learner@example.org'
```

## `PATCH /api/enrollment-requests/{id}/status`

```json
{ "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Learner has not completed the prerequisite course." }
```

`status` and `changedBy` are required; `reason` is required (non-empty) only for `rejected`. `200` with the updated request; a history entry is appended.

Allowed transitions: `pending → approved`, `pending → rejected`, `pending → cancelled`, `approved → cancelled`.

## Errors

Body: `{ "error": { "code", "message", "details": [{ "field", "message" }] } }`.

| Case | Status | Code |
| --- | --- | --- |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Course is draft or retired | 409 | `COURSE_NOT_ACTIVE` |
| Invalid email, justification length, missing field, bad JSON, unknown status, rejection without reason | 400 | `INVALID_REQUEST` |
| Learner already has a pending or approved request for the course | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Request id not found | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Transition not allowed | 409 | `INVALID_STATUS_TRANSITION` |
