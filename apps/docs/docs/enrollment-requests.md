# Enrollment requests

Learners request a place on an active course; reviewers approve, reject or cancel.

## Endpoints

| Method and path | Purpose | Success |
| --- | --- | --- |
| POST /api/enrollment-requests | Create a request | `201` |
| GET /api/enrollment-requests/:id | Fetch one request | `200` |
| GET /api/enrollment-requests | List requests, optional `status`, `courseId`, `learnerEmail` filters | `200` with `items` |
| PATCH /api/enrollment-requests/:id/status | Change status | `200` |

## Create

```json
{
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work."
}
```

Rules: the course must exist and be `active`; `learnerEmail` must be a valid email; `justification` is 20 to 500 characters; a learner may hold only one `pending` or `approved` request per course. New requests start `pending`.

## Request body returned by every endpoint

```json
{
  "id": "4b6c…",
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

The list endpoint returns `{ "items": [ … ] }`.

## Change status

```json
{ "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Learner has not completed the prerequisite course." }
```

Allowed transitions: `pending` to `approved`, `rejected` or `cancelled`; `approved` to `cancelled`. `reason` is required (non-empty) for `rejected`, optional otherwise. Each creation and change appends a `statusHistory` entry.

## Errors

Body: `{ "error": { "code", "message", "details": [{ "field", "message" }] } }`.

| Case | Status | Code |
| --- | --- | --- |
| Course does not exist | 404 | COURSE_NOT_FOUND |
| Course is draft or retired | 409 | COURSE_NOT_ACTIVE |
| Invalid email, justification length, missing field, bad status value, rejection without reason, malformed JSON | 400 | INVALID_REQUEST |
| Learner already has a pending or approved request for the course | 409 | DUPLICATE_ACTIVE_REQUEST |
| Request id unknown | 404 | ENROLLMENT_REQUEST_NOT_FOUND |
| Transition not allowed | 409 | INVALID_STATUS_TRANSITION |
