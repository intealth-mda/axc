---
id: enrollment-requests
title: Enrollment requests
---

# Enrollment requests

## EnrollmentRequest

| field | type | notes |
| --- | --- | --- |
| `id` | string | generated UUID |
| `courseId` | string | existing active course |
| `learnerEmail` | string | valid email |
| `justification` | string | 20 to 500 characters |
| `status` | enum | `pending`, `approved`, `rejected`, `cancelled` |
| `createdAt`, `updatedAt` | string | ISO date |
| `statusHistory` | array | entries of `fromStatus` (null on creation), `toStatus`, `changedAt`, `changedBy`, `reason` |

## POST /api/enrollment-requests

```json
{ "courseId": "course-001", "learnerEmail": "learner@example.org", "justification": "I need this course to prepare for upcoming secure development work." }
```

Returns 201 with the request, status `pending`, and one history entry:

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

## GET /api/enrollment-requests/:id

Returns 200 with the request, including `statusHistory`.

## GET /api/enrollment-requests

Optional filters `status`, `courseId`, `learnerEmail` (case-insensitive). Returns 200 with an array of requests.

## PATCH /api/enrollment-requests/:id/status

```json
{ "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Learner has not completed the prerequisite course." }
```

`changedBy` is required; `reason` is required for `rejected`, optional otherwise. Valid transitions: `pending` to `approved`, `rejected` or `cancelled`; `approved` to `cancelled`. Each change appends a history entry. Returns 200 with the updated request.

## Errors

Body: `error.code`, `error.message`, `error.details` (list of `field` and `message`).

| case | status | code |
| --- | --- | --- |
| course does not exist | 404 | `COURSE_NOT_FOUND` |
| course draft or retired | 409 | `COURSE_NOT_ACTIVE` |
| invalid email, justification length, missing field, invalid JSON | 400 | `INVALID_REQUEST` |
| duplicate pending or approved request | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| request not found | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| invalid status value or filter | 400 | `INVALID_REQUEST` |
| invalid transition | 409 | `INVALID_STATUS_TRANSITION` |
| rejection without reason | 400 | `INVALID_REQUEST` |
