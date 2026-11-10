---
id: enrollment-requests
title: Enrollment requests
---

# Enrollment requests

A learner asks to enroll in an active course; reviewers approve, reject or cancel.

## Resource

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | UUID |
| `courseId` | string | existing `active` course |
| `learnerEmail` | string | valid email, stored lower-case |
| `justification` | string | 20–500 characters |
| `status` | string | `pending`, `approved`, `rejected`, `cancelled` |
| `createdAt` / `updatedAt` | string | ISO date |
| `statusHistory` | array | audit trail, one entry per creation and status change |

`statusHistory` entry: `fromStatus` (`null` on creation), `toStatus`, `changedAt`, `changedBy` (`system` on creation), `reason` (`null` unless given).

## POST /api/enrollment-requests

```json
{ "courseId": "course-001", "learnerEmail": "learner@example.org", "justification": "I need this course to prepare for upcoming secure development work." }
```

201 returns the resource with `status: "pending"`:

```json
{
  "id": "6f1c…",
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

200 returns the resource, including `statusHistory`.

## GET /api/enrollment-requests

Optional filters: `status`, `courseId`, `learnerEmail` (case-insensitive). 200 returns an array of resources.

## PATCH /api/enrollment-requests/:id/status

```json
{ "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Learner has not completed the prerequisite course." }
```

`changedBy` required; `reason` required (non-empty) for `rejected`, optional otherwise. Allowed transitions: `pending → approved | rejected | cancelled`, `approved → cancelled`. 200 returns the updated resource with a new `statusHistory` entry.

## Errors

Body: `{ "error": { "code", "message", "details": [{ "field", "message" }] } }`.

| Case | Status | Code |
| --- | --- | --- |
| Invalid email, justification length, missing field, bad JSON, invalid status value or filter, rejection without reason | 400 | `INVALID_REQUEST` |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Request does not exist | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Course is draft or retired | 409 | `COURSE_NOT_ACTIVE` |
| Duplicate pending/approved request | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Transition not allowed | 409 | `INVALID_STATUS_TRANSITION` |

```bash
curl -X POST localhost:7071/api/enrollment-requests -H 'Content-Type: application/json' \
  -d '{"courseId":"course-001","learnerEmail":"learner@example.org","justification":"I need this course for upcoming work."}'
curl -X PATCH localhost:7071/api/enrollment-requests/<id>/status -H 'Content-Type: application/json' \
  -d '{"status":"approved","changedBy":"reviewer@example.org"}'
```
