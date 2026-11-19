# Enrollment requests

Learners request enrollment in an active course; reviewers approve, reject or cancel. Data is in memory.

## Model

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | generated UUID |
| `courseId` | string | existing `active` course |
| `learnerEmail` | string | valid email, stored lower-case |
| `justification` | string | 20 to 500 characters |
| `status` | string | `pending`, `approved`, `rejected`, `cancelled` |
| `createdAt`, `updatedAt` | string | ISO date |
| `statusHistory` | array | entries of `fromStatus` (null on creation), `toStatus`, `changedAt`, `changedBy` (`system` on creation), `reason` |

## POST /api/enrollment-requests

```json
{ "courseId": "course-001", "learnerEmail": "learner@example.org", "justification": "I need this course to prepare for upcoming secure development work." }
```

`201` with the request (status `pending`, one `statusHistory` entry):

```json
{
  "id": "4f0c…",
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work.",
  "status": "pending",
  "createdAt": "2026-06-27T10:00:00.000Z",
  "updatedAt": "2026-06-27T10:00:00.000Z",
  "statusHistory": [{ "fromStatus": null, "toStatus": "pending", "changedAt": "2026-06-27T10:00:00.000Z", "changedBy": "system", "reason": null }]
}
```

A learner may hold only one `pending` or `approved` request per course.

## GET /api/enrollment-requests/:id

`200` with the request, including `statusHistory`.

## GET /api/enrollment-requests

Optional filters `status`, `courseId`, `learnerEmail` (case-insensitive). `200` with an array of requests.

## PATCH /api/enrollment-requests/:id/status

```json
{ "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Learner has not completed the prerequisite course." }
```

`changedBy` is required; `reason` is required for `rejected`. Allowed transitions: pending to approved, rejected or cancelled; approved to cancelled. `200` with the updated request; each change appends a `statusHistory` entry.

## Errors

Body: `{ "error": { "code", "message", "details": [{ "field", "message" }] } }`.

| Case | Status | Code |
| --- | --- | --- |
| Invalid email, justification, status value, missing reason or changedBy, bad JSON | 400 | `INVALID_REQUEST` |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Request does not exist | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Course draft or retired | 409 | `COURSE_NOT_ACTIVE` |
| Duplicate pending or approved request | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Transition not allowed | 409 | `INVALID_STATUS_TRANSITION` |
