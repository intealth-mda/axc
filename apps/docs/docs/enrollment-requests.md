---
id: enrollment-requests
title: Enrollment requests
---

# Enrollment requests

A learner asks to join an active course; reviewers approve, reject or cancel. Data is in-memory and resets on restart.

## EnrollmentRequest

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | `enroll-001`, `enroll-002`, … |
| `courseId` | string | existing course with status `active` |
| `learnerEmail` | string | valid email |
| `justification` | string | 20–500 characters |
| `status` | string | `pending`, `approved`, `rejected`, `cancelled` |
| `createdAt` / `updatedAt` | string | ISO date |
| `statusHistory` | array | one entry per creation and status change: `fromStatus` (`null` on creation), `toStatus`, `changedAt`, `changedBy` (`system` on creation), `reason` (or `null`) |

## `POST /api/enrollment-requests` — create

```json
{ "courseId": "course-001", "learnerEmail": "learner@example.org", "justification": "I need this course to prepare for upcoming secure development work." }
```

**201** — the new request, status `pending`:

```json
{
  "id": "enroll-001",
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

## `GET /api/enrollment-requests/:id` — retrieve

**200** — the request, including `statusHistory`.

## `GET /api/enrollment-requests` — list

Optional exact-match filters: `status`, `courseId`, `learnerEmail` (case-insensitive).

**200** — `{ "items": [ EnrollmentRequest, ... ] }`

## `PATCH /api/enrollment-requests/:id/status` — change status

```json
{ "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Learner has not completed the prerequisite course." }
```

`changedBy` is required; `reason` is required for `rejected`, optional otherwise.
Allowed transitions: `pending → approved`, `pending → rejected`, `pending → cancelled`, `approved → cancelled`.

**200** — the updated request with a new `statusHistory` entry.

## Errors

Body: `{ "error": { "code": "...", "message": "...", "details": [{ "field": "...", "message": "..." }] } }`

| Case | Status | Code |
| --- | --- | --- |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Course is draft or retired | 409 | `COURSE_NOT_ACTIVE` |
| Invalid email, justification length, missing `courseId`/`changedBy`, bad JSON | 400 | `INVALID_REQUEST` |
| Duplicate pending or approved request | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Request not found | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Unknown status value | 400 | `INVALID_REQUEST` |
| Transition not allowed | 409 | `INVALID_STATUS_TRANSITION` |
| Rejection without reason | 400 | `INVALID_REQUEST` |

```bash
curl -X POST localhost:7071/api/enrollment-requests -H 'Content-Type: application/json' \
  -d '{"courseId":"course-001","learnerEmail":"learner@example.org","justification":"I need this course for upcoming secure work."}'
curl -X PATCH localhost:7071/api/enrollment-requests/enroll-001/status -H 'Content-Type: application/json' \
  -d '{"status":"approved","changedBy":"reviewer@example.org"}'
```
