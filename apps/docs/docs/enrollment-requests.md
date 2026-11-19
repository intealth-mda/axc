---
id: enrollment-requests
title: Courses and enrollment requests
---

# Courses and enrollment requests

All errors use one shape:

```json
{ "error": { "code": "INVALID_REQUEST", "message": "The request could not be completed.", "details": [{ "field": "justification", "message": "justification must be between 20 and 500 characters." }] } }
```

## `GET /api/courses`

Query parameters (all optional): `q` (case-insensitive match on title, summary, tags), `modality` (`online`, `in-person`, `hybrid`), `status` (`draft`, `active`, `retired`), `tag` (case-insensitive), `page` (default 1), `pageSize` (1–50, default 10), `sort` (`title` default, `createdAt`, `updatedAt`).

```json
{ "items": [{ "id": "course-001", "title": "AI Security Foundations", "summary": "…", "modality": "online", "status": "active", "tags": ["ai", "security"], "createdAt": "2026-02-02T00:00:00.000Z", "updatedAt": "2026-06-02T00:00:00.000Z" }], "page": 1, "pageSize": 10, "totalItems": 1, "totalPages": 1 }
```

Invalid parameter: 400 `INVALID_QUERY_PARAMETER`. No matches: 200 with empty `items`.

## `POST /api/enrollment-requests`

```json
{ "courseId": "course-001", "learnerEmail": "learner@example.org", "justification": "I need this course to prepare for upcoming secure development work." }
```

Returns 201 with the request, status `pending`, and one history entry:

```json
{
  "id": "enroll-…", "courseId": "course-001", "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work.",
  "status": "pending", "createdAt": "2026-06-27T10:00:00.000Z", "updatedAt": "2026-06-27T10:00:00.000Z",
  "statusHistory": [{ "fromStatus": null, "toStatus": "pending", "changedAt": "2026-06-27T10:00:00.000Z", "changedBy": "system", "reason": null }]
}
```

## `GET /api/enrollment-requests/:id`

Returns the request (same shape, with `statusHistory`).

## `GET /api/enrollment-requests`

Optional filters `status`, `courseId`, `learnerEmail` (case-insensitive). Returns `{ "items": [ … ] }`.

## `PATCH /api/enrollment-requests/:id/status`

```json
{ "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Learner has not completed the prerequisite course." }
```

`reason` is required for `rejected`, optional otherwise. Valid transitions: pending → approved, pending → rejected, pending → cancelled, approved → cancelled. Returns 200 with the updated request; a new `statusHistory` entry is appended.

## Error cases

| Case | Status | Code |
| --- | --- | --- |
| Invalid course search parameter | 400 | `INVALID_QUERY_PARAMETER` |
| Invalid email, justification outside 20–500 chars, bad JSON, invalid status value, rejection without reason | 400 | `INVALID_REQUEST` |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Request does not exist | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Course is draft or retired | 409 | `COURSE_NOT_ACTIVE` |
| Learner already has a pending or approved request for the course | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Transition not allowed | 409 | `INVALID_STATUS_TRANSITION` |

## Example

```bash
curl -X POST http://localhost:7071/api/enrollment-requests -H 'Content-Type: application/json' \
  -d '{"courseId":"course-001","learnerEmail":"learner@example.org","justification":"I need this course to prepare for work."}'
```
