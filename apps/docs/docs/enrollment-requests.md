# Enrollment requests

A learner asks to enroll in an active course; reviewers approve, reject or cancel the request. Every creation and status change appends an entry to `statusHistory`. Data is held in memory and resets when the API restarts.

## Endpoints

| Method and path | Purpose | Success |
| --- | --- | --- |
| `POST /api/enrollment-requests` | Create a request | `201` |
| `GET /api/enrollment-requests/:id` | Get one request with its `statusHistory` | `200` |
| `GET /api/enrollment-requests` | List requests; optional filters `status`, `courseId`, `learnerEmail` | `200` |
| `PATCH /api/enrollment-requests/:id/status` | Change the status | `200` |

## Create

Request body (all fields required):

```json
{
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work."
}
```

Rules: the course must exist and be `active`; `learnerEmail` must be a valid email; `justification` must be 20 to 500 characters; the learner must not already have a `pending` or `approved` request for the course. New requests start `pending`.

Response body (also returned by get and status change):

```json
{
  "id": "4f1c…",
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

## List

`GET /api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=learner@example.org` returns `{ "items": [ … ] }`. `learnerEmail` matches case-insensitively.

## Change status

```json
{ "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Learner has not completed the prerequisite course." }
```

`changedBy` is required. `reason` is optional, except when rejecting. Valid transitions:

| From | To |
| --- | --- |
| `pending` | `approved`, `rejected`, `cancelled` |
| `approved` | `cancelled` |

## Errors

Body: `{ "error": { "code", "message", "details": [ { "field", "message" } ] } }`.

| Case | Status | Code |
| --- | --- | --- |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Course is draft or retired | 409 | `COURSE_NOT_ACTIVE` |
| Invalid email, justification length, missing field, bad JSON, unknown status value, rejection without reason | 400 | `INVALID_REQUEST` |
| Learner already has a pending or approved request for the course | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Request id not found | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Transition not allowed | 409 | `INVALID_STATUS_TRANSITION` |
