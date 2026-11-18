# Enrollment requests

Learners request a place on an `active` course; reviewers approve, reject or cancel.

## Model

| field | type | notes |
| --- | --- | --- |
| `id` | string | generated |
| `courseId` | string | existing `active` course |
| `learnerEmail` | string | valid email |
| `justification` | string | 20 to 500 characters |
| `status` | string | `pending`, `approved`, `rejected`, `cancelled` |
| `createdAt`, `updatedAt` | string | ISO date |
| `statusHistory` | array | `fromStatus` (null on creation), `toStatus`, `changedAt`, `changedBy`, `reason` |

## POST /api/enrollment-requests

```json
{
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work."
}
```

`201` with the request:

```json
{
  "id": "3f0c…",
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

## GET /api/enrollment-requests/:id

`200` with the request (including `statusHistory`), or `404`.

## GET /api/enrollment-requests

Optional filters `status`, `courseId`, `learnerEmail` (combined with AND). `200` with `{ "items": [ … ] }`.

## PATCH /api/enrollment-requests/:id/status

```json
{ "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Learner has not completed the prerequisite course." }
```

Allowed: `pending` to `approved`, `rejected` or `cancelled`; `approved` to `cancelled`. `reason` is required for `rejected`, optional otherwise. Each change appends a `statusHistory` entry. `200` with the updated request.

## Errors

Body: `{ "error": { "code", "message", "details": [{ "field", "message" }] } }`.

| case | status | code |
| --- | --- | --- |
| invalid body, email, justification, status value, filter, or missing reason | 400 | `INVALID_REQUEST` |
| course does not exist | 404 | `COURSE_NOT_FOUND` |
| request does not exist | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| course is draft or retired | 409 | `COURSE_NOT_ACTIVE` |
| learner already has a pending or approved request for the course | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| transition not allowed | 409 | `INVALID_STATUS_TRANSITION` |

```bash
curl -X POST http://localhost:7071/api/enrollment-requests -H 'Content-Type: application/json' \
  -d '{"courseId":"course-001","learnerEmail":"learner@example.org","justification":"I need this course for upcoming work."}'
```
