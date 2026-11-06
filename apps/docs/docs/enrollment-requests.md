# Enrollment requests

Learners request a seat in an active course. Reviewers approve, reject, or cancel those requests. The API stores requests in memory for the life of the API process.

## Create an enrollment request

```http
POST /api/enrollment-requests
```

```json
{
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work."
}
```

| Field | Rules |
| --- | --- |
| `courseId` | Required non-empty string. Must be the id of an existing course with status `active`. |
| `learnerEmail` | Required valid email address. Leading and trailing spaces are removed. Comparison for duplicates and filters is case-insensitive. |
| `justification` | Required. After trimming, the length must be from 20 through 500 characters. |

Unknown JSON fields are ignored. A request is created only when the body is valid, the course exists and is active, and the learner does not already have a `pending` or `approved` request for that course. A `rejected` or `cancelled` request does not block a new one.

`201` returns the new request. New requests start as `pending`. Creation appends one `statusHistory` entry with `fromStatus: null`, `toStatus: "pending"`, `changedBy: "system"`, and `reason: null`.

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
    {
      "fromStatus": null,
      "toStatus": "pending",
      "changedAt": "2026-06-27T10:00:00.000Z",
      "changedBy": "system",
      "reason": null
    }
  ]
}
```

Ids are `enroll-001`, `enroll-002`, and so on, for the current process.

## Read one enrollment request

```http
GET /api/enrollment-requests/enroll-001
```

`200` returns the same object shape as create, including the full `statusHistory`.

## List enrollment requests

```http
GET /api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=learner@example.org
```

All three filters are optional and combine with AND. Results stay in creation order.

| Query parameter | Rules |
| --- | --- |
| `status` | `pending`, `approved`, `rejected`, or `cancelled`. |
| `courseId` | Non-empty course id. Exact match. |
| `learnerEmail` | Valid email. Case-insensitive exact match. |

`200` returns:

```json
{
  "items": []
}
```

`items` is empty when nothing matches. That response is not an error. Each parameter may be sent once. Any other query parameter is invalid.

## Update enrollment request status

```http
PATCH /api/enrollment-requests/enroll-001/status
```

Approval:

```json
{
  "status": "approved",
  "changedBy": "reviewer@example.org"
}
```

Rejection:

```json
{
  "status": "rejected",
  "changedBy": "reviewer@example.org",
  "reason": "Learner has not completed the prerequisite course."
}
```

| Field | Rules |
| --- | --- |
| `status` | Required. `pending`, `approved`, `rejected`, or `cancelled`. |
| `changedBy` | Required non-empty reviewer or operator identifier. |
| `reason` | Required, non-empty, and trimmed when `status` is `rejected`. Optional for other statuses. Stored as `null` when omitted or blank on a non-rejection. |

Valid transitions are:

| From | To |
| --- | --- |
| `pending` | `approved`, `rejected`, `cancelled` |
| `approved` | `cancelled` |

`rejected` and `cancelled` are terminal. Repeating the current status is not a transition.

`200` returns the updated request. `createdAt` stays the same. `updatedAt` becomes the new history entry's `changedAt`. Every status change appends one `statusHistory` entry. An invalid transition does not append an entry.

There is no authentication on this sample route. `changedBy` is the identifier supplied by the caller.

## Error response

Validation errors use `400`:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request could not be completed.",
    "details": [
      {
        "field": "justification",
        "message": "justification must be between 20 and 500 characters."
      }
    ]
  }
}
```

| Scenario | Status | Code |
| --- | --- | --- |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Course is not `active` | 409 | `COURSE_NOT_ACTIVE` |
| Invalid email, justification, status, reviewer, or rejection reason | 400 | `INVALID_REQUEST` |
| Body is not a JSON object | 400 | `INVALID_REQUEST` |
| Invalid list query | 400 | `INVALID_REQUEST` |
| Duplicate `pending` or `approved` request for the same learner and course | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Request id does not exist | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Status value is not one of the four statuses | 400 | `INVALID_REQUEST` |
| Status value is known but the transition is not allowed | 409 | `INVALID_STATUS_TRANSITION` |
| Rejection without a non-empty reason | 400 | `INVALID_REQUEST` |

Invalid create input is rejected before the course lookup. A rejection without a reason is rejected before the transition check.

## Example

```bash
curl -s -X POST https://api.agentcourses.localhost/api/enrollment-requests \
  -H 'content-type: application/json' \
  -d '{"courseId":"course-001","learnerEmail":"learner@example.org","justification":"I need this course to prepare for upcoming secure development work."}'
```

Local `pnpm run dev` publishes the API through portless at `https://api.agentcourses.localhost`. A git worktree named `feature-a` uses `https://api.agentcourses.feature-a.localhost` when `WORKTREE_NAME=feature-a`.

The request store is empty when the process starts and is discarded when the process stops. Course search is unchanged and is documented in [Course catalog](./courses).
