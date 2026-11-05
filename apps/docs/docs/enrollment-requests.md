# Enrollment requests

A learner asks to enroll in an active course; reviewers approve, reject or cancel. Data is in memory and resets when the host restarts.

## Model

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | UUID assigned on create. |
| `courseId` | string | Existing course with status `active`. |
| `learnerEmail` | string | Valid email, stored lower-case. |
| `justification` | string | 20–500 characters (trimmed). |
| `status` | string | `pending`, `approved`, `rejected`, `cancelled`. |
| `createdAt` / `updatedAt` | string | ISO-8601. |
| `statusHistory` | array | One entry per creation and status change: `fromStatus` (`null` on create), `toStatus`, `changedAt`, `changedBy` (`system` on create), `reason` (or `null`). |

## `POST /api/enrollment-requests`

```json
{
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work."
}
```

`201` with the new request, status `pending`:

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

## `GET /api/enrollment-requests/{id}`

`200` with the request (including `statusHistory`), or `404`.

## `GET /api/enrollment-requests`

Optional filters `status`, `courseId`, `learnerEmail` (case-insensitive), combined with AND. `200` with a JSON array of requests.

```http
GET /api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=learner@example.org
```

## `PATCH /api/enrollment-requests/{id}/status`

```json
{ "status": "rejected", "changedBy": "reviewer@example.org", "reason": "Learner has not completed the prerequisite course." }
```

`changedBy` is required; `reason` is required for `rejected`, optional otherwise. Allowed transitions: `pending` → `approved` | `rejected` | `cancelled`, `approved` → `cancelled`. `200` with the updated request and a new `statusHistory` entry.

## Errors

Body: `{ "error": { "code", "message", "details": [{ "field", "message" }] } }`.

| Case | Status | Code |
| --- | --- | --- |
| Body not JSON, missing `courseId`, invalid email, justification length, invalid status value or filter, missing `changedBy`, rejection without reason | 400 | `INVALID_REQUEST` |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Request does not exist | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Course is draft or retired | 409 | `COURSE_NOT_ACTIVE` |
| Learner already has a pending or approved request for the course | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Transition not allowed | 409 | `INVALID_STATUS_TRANSITION` |

```bash
curl -X PATCH http://localhost:7071/api/enrollment-requests/<id>/status \
  -H 'Content-Type: application/json' \
  -d '{"status":"approved","changedBy":"reviewer@example.org"}'
```
