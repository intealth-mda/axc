---
id: enrollment-requests
title: Enrollment requests
---

# Enrollment requests

A learner asks to enroll in an active course; a reviewer approves, rejects or cancels. Storage is in-memory (lost on restart).

## EnrollmentRequest

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | UUID |
| `courseId` | string | existing `active` course |
| `learnerEmail` | string | valid email, stored lower-case |
| `justification` | string | 20–500 characters |
| `status` | `pending` \| `approved` \| `rejected` \| `cancelled` | starts `pending` |
| `createdAt`, `updatedAt` | ISO string | |
| `statusHistory` | `StatusHistoryEntry[]` | one entry per creation and status change |

`StatusHistoryEntry`: `fromStatus` (`null` on creation), `toStatus`, `changedAt`, `changedBy` (`system` on creation), `reason` (`null` unless given).

## POST /api/enrollment-requests

```json
{ "courseId": "course-001", "learnerEmail": "learner@example.org", "justification": "I need this course to prepare for upcoming secure development work." }
```

**201**:

```json
{
  "id": "4f0c…",
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

**200**: the request, including `statusHistory`. **404** if unknown.

## GET /api/enrollment-requests

Optional exact-match filters: `status`, `courseId`, `learnerEmail` (case-insensitive). **200**: `{ "items": [EnrollmentRequest, …] }`.

## PATCH /api/enrollment-requests/:id/status

```json
{ "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Learner has not completed the prerequisite course." }
```

`changedBy` is required; `reason` is optional except for `rejected`. Allowed transitions: `pending → approved | rejected | cancelled`, `approved → cancelled`. **200**: the updated request with a new `statusHistory` entry.

```bash
curl -X PATCH http://localhost:7071/api/enrollment-requests/<id>/status \
  -H 'content-type: application/json' -d '{"status":"approved","changedBy":"reviewer@example.org"}'
```

## Errors

Body: `{ "error": { "code", "message", "details": [{ "field", "message" }] } }`.

| Case | Status | Code |
| --- | --- | --- |
| Malformed JSON, missing field, invalid email, justification length, invalid status value, rejection without reason | 400 | `INVALID_REQUEST` |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Request does not exist | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Course is draft or retired | 409 | `COURSE_NOT_ACTIVE` |
| Duplicate pending/approved request | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Transition not allowed | 409 | `INVALID_STATUS_TRANSITION` |
