# Enrollment requests

Learners request a seat in an active course. Reviewers approve, reject, or cancel those requests. The API keeps one in-memory list for the life of the process, seeded with no requests.

`GET /api/courses` is unchanged. Only a course whose status is `active` can receive a new request.

## Create a request

```http
POST /api/enrollment-requests
Content-Type: application/json
```

```json
{
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work."
}
```

| Field | Rule |
| --- | --- |
| `courseId` | Required. Must be the id of an existing course with status `active`. |
| `learnerEmail` | Required. Trimmed, then checked as a single email address with a domain dot. Comparison for duplicates and list filters is case-insensitive. The stored value keeps the trimmed casing. |
| `justification` | Required. 20 to 500 characters, counted without trimming. |

Any other field is rejected. A new request is `pending`. The first `statusHistory` entry uses `fromStatus: null`, `toStatus: "pending"`, and `changedBy: "system"`.

`201` returns the request:

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

Ids are `enroll-001`, `enroll-002`, and so on, for this process.

A learner may have at most one `pending` or `approved` request for the same course. `rejected` and `cancelled` requests do not count. The same learner may request a different course, and another learner may request the same course.

## Read one request

```http
GET /api/enrollment-requests/enroll-001
```

`200` returns the same object as create, including the full `statusHistory`.

## List requests

```http
GET /api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=learner@example.org
```

| Query parameter | Rule |
| --- | --- |
| `status` | Optional. `pending`, `approved`, `rejected`, or `cancelled`. |
| `courseId` | Optional. Exact course id. |
| `learnerEmail` | Optional. Case-insensitive exact email. |

Filters combine with AND. Each parameter may be sent once. Any other query parameter is invalid. There is no pagination. Results are ordered by `createdAt`, then `id`.

`200` returns:

```json
{
  "items": []
}
```

An empty `items` array means no request matched.

## Change status

```http
PATCH /api/enrollment-requests/enroll-001/status
Content-Type: application/json
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

| Field | Rule |
| --- | --- |
| `status` | Required. `pending`, `approved`, `rejected`, or `cancelled`. |
| `changedBy` | Required. Non-empty reviewer or operator id. Stored trimmed. |
| `reason` | Required and non-empty when `status` is `rejected`. Optional for other transitions. A blank optional reason is stored as `null`. A provided reason is stored trimmed. |

Allowed transitions:

| From | To |
| --- | --- |
| `pending` | `approved`, `rejected`, `cancelled` |
| `approved` | `cancelled` |

`rejected` and `cancelled` are terminal. Repeating the current status is not a transition.

`200` returns the updated request. Each successful change appends one `statusHistory` entry and sets `updatedAt` to that entry's `changedAt`. `createdAt` stays the creation time.

## Error response

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

| Situation | Status | Code |
| --- | --- | --- |
| Body is not a JSON object, email is invalid, justification length is wrong, status value is invalid, rejection has no reason, or a list filter is invalid | 400 | `INVALID_REQUEST` |
| `courseId` is not in the catalog | 404 | `COURSE_NOT_FOUND` |
| Course exists but is `draft` or `retired` | 409 | `COURSE_NOT_ACTIVE` |
| Learner already has a `pending` or `approved` request for that course | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Request id is unknown | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Status value is known but the transition is not allowed | 409 | `INVALID_STATUS_TRANSITION` |

`details` lists every invalid field. A failed change does not append history.

## Example

```bash
curl -s -X POST "https://api.agentcourses.localhost/api/enrollment-requests" \
  -H "content-type: application/json" \
  -d '{"courseId":"course-001","learnerEmail":"learner@example.org","justification":"I need this course to prepare for upcoming secure development work."}'
```

Local `pnpm run dev` publishes the API through portless at `https://api.agentcourses.localhost`.

The storage and transition choices are recorded in [Record enrollment requests in memory](./decisions/0002-enrollment-request-workflow.md).
