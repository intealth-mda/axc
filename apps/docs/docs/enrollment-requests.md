---
title: Enrollment requests
---

# Enrollment requests

Learners request a seat on an active course; reviewers approve, reject or cancel. Every creation and status change appends a `statusHistory` entry.

## Endpoints

| Method and path | Purpose | Success |
| --- | --- | --- |
| `POST /api/enrollment-requests` | create a request (starts `pending`) | 201 |
| `GET /api/enrollment-requests/:id` | fetch one request with `statusHistory` | 200 |
| `GET /api/enrollment-requests` | list; optional filters `status`, `courseId`, `learnerEmail` | 200, body `items` array |
| `PATCH /api/enrollment-requests/:id/status` | change status | 200 |

## Create request body

```json
{
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work."
}
```

Rules: course must exist and be `active`; `learnerEmail` a valid email; `justification` 20 to 500 characters; one `pending` or `approved` request per learner and course.

## Response body (create, get, patch)

```json
{
  "id": "enroll-…",
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

## Status change body

```json
{ "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Learner has not completed the prerequisite course." }
```

Allowed transitions: `pending` to `approved`, `rejected` or `cancelled`; `approved` to `cancelled`. `reason` is required for `rejected`.

## Error cases

Body shape: `error` object with `code`, `message`, `details` (list of `field` and `message`).

| Case | Status | Code |
| --- | --- | --- |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Course is not active | 409 | `COURSE_NOT_ACTIVE` |
| Invalid email, bad justification, invalid JSON, missing field | 400 | `INVALID_REQUEST` |
| Duplicate pending or approved request | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Request not found | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Invalid status value | 400 | `INVALID_REQUEST` |
| Invalid status transition | 409 | `INVALID_STATUS_TRANSITION` |
| Rejection without reason | 400 | `INVALID_REQUEST` |

```bash
curl -X PATCH http://localhost:7071/api/enrollment-requests/enroll-001/status \
  -H "Content-Type: application/json" -d '{"status":"approved","changedBy":"reviewer@example.org"}'
```
