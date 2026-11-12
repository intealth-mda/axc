# Enrollment requests

Learners request enrollment in an active course; reviewers approve, reject or cancel. Requests live in memory.

## EnrollmentRequest

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | generated UUID |
| `courseId` | string | existing `active` course |
| `learnerEmail` | string | valid email |
| `justification` | string | 20 to 500 characters |
| `status` | string | `pending`, `approved`, `rejected`, `cancelled` |
| `createdAt`, `updatedAt` | string | ISO-8601 |
| `statusHistory` | array | one entry per creation and status change |

Each `statusHistory` entry: `fromStatus` (null on creation), `toStatus`, `changedAt`, `changedBy` (`system` on creation), `reason` (null unless given).

## POST /api/enrollment-requests

```json
{
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work."
}
```

`201`:

```json
{
  "id": "9b1c...",
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

A learner may hold at most one `pending` or `approved` request per course.

## GET /api/enrollment-requests/:id

`200` with the request (including `statusHistory`), or `404`.

## GET /api/enrollment-requests

Optional query filters `status`, `courseId`, `learnerEmail` (case-insensitive). `200`: `{ "items": [ ...requests ] }`.

## PATCH /api/enrollment-requests/:id/status

```json
{ "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Learner has not completed the prerequisite course." }
```

`reason` is required for `rejected`, optional otherwise. Allowed transitions: `pending` to `approved`, `rejected` or `cancelled`; `approved` to `cancelled`. `200` with the updated request.

## Errors

Body: `{ "error": { "code": "...", "message": "...", "details": [ { "field": "...", "message": "..." } ] } }`.

| Case | Status | Code |
| --- | --- | --- |
| Invalid JSON, field, email, justification, status value, missing rejection reason | 400 | `INVALID_REQUEST` |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Course is draft or retired | 409 | `COURSE_NOT_ACTIVE` |
| Duplicate pending or approved request | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Request not found | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Transition not allowed | 409 | `INVALID_STATUS_TRANSITION` |

```bash
curl -X POST http://localhost:7071/api/enrollment-requests -H 'Content-Type: application/json' \
  -d '{"courseId":"course-001","learnerEmail":"learner@example.org","justification":"I need this course to prepare for upcoming work."}'
```
