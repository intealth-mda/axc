# Enrollment requests

Learners request enrollment in an active course. Reviewers list the requests and approve, reject, or cancel them. Every request keeps an audit trail of its status changes in `statusHistory`.

| Method | Path | Purpose | Success |
| --- | --- | --- | --- |
| `POST` | `/api/enrollment-requests` | Create a request | `201` |
| `GET` | `/api/enrollment-requests` | List requests, with optional filters | `200` |
| `GET` | `/api/enrollment-requests/:id` | Get one request | `200` |
| `PATCH` | `/api/enrollment-requests/:id/status` | Change a request's status | `200` |

Requests are stored in memory, per API process. They are lost on restart, and separate processes do not share them.

## The enrollment request object

Every success response returns this object (the list wraps it in `items`):

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

| Field | Meaning |
| --- | --- |
| `id` | Request ID, assigned in order: `enroll-001`, `enroll-002`, and so on. |
| `courseId` | The requested course. |
| `learnerEmail` | The learner's email, as submitted. |
| `justification` | Why the learner needs the course. |
| `status` | `pending`, `approved`, `rejected`, or `cancelled`. |
| `createdAt` | When the request was created (ISO 8601). |
| `updatedAt` | When the status last changed (ISO 8601). Equals `createdAt` until the first change. |
| `statusHistory` | Audit trail, oldest first. One entry for creation, plus one per status change. |

Each `statusHistory` entry:

| Field | Meaning |
| --- | --- |
| `fromStatus` | The previous status. `null` for the creation entry. |
| `toStatus` | The new status. |
| `changedAt` | When the change happened (ISO 8601). |
| `changedBy` | Who made the change. `system` for the creation entry. |
| `reason` | The reason given, or `null`. Always present for rejections. |

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
| `courseId` | Required non-empty string. The course must exist and have status `active`. |
| `learnerEmail` | Required string in a valid email format (`name@domain.tld`). |
| `justification` | Required string, 20 to 500 characters after trimming. |

The new request starts as `pending`, with one `statusHistory` entry from `null` to `pending` by `system`. Response: `201` with the request object.

A learner may have only one active (`pending` or `approved`) request per course. The email comparison ignores case. After a request is `rejected` or `cancelled`, the learner may request the course again.

## List requests

```http
GET /api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=learner@example.org
```

All query parameters are optional, and they combine with AND.

| Parameter | Allowed values | Behavior |
| --- | --- | --- |
| `status` | `pending`, `approved`, `rejected`, `cancelled` | Only requests with this status. Any other value is a `400`. |
| `courseId` | Any text | Only requests for this course. |
| `learnerEmail` | Any text | Only requests from this email, ignoring case. |

Response: `200` with the matching requests in creation order. No matches is not an error; `items` is empty.

```json
{
  "items": [
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
  ]
}
```

## Get a request

```http
GET /api/enrollment-requests/enroll-001
```

Response: `200` with the request object, including its full `statusHistory`.

## Change a request's status

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

Rejection (a reason is required):

```json
{
  "status": "rejected",
  "changedBy": "reviewer@example.org",
  "reason": "Learner has not completed the prerequisite course."
}
```

| Field | Rule |
| --- | --- |
| `status` | Required. One of `pending`, `approved`, `rejected`, `cancelled`. |
| `changedBy` | Required non-empty string identifying the reviewer or operator. |
| `reason` | Optional string. Required and non-empty when `status` is `rejected`. |

Allowed transitions:

| From | To |
| --- | --- |
| `pending` | `approved`, `rejected`, `cancelled` |
| `approved` | `cancelled` |

`rejected` and `cancelled` are final. Any other transition, including to the same status, is a `409`.

On success the status and `updatedAt` change, and one entry is appended to `statusHistory`. Response: `200` with the updated request object. For example, after the approval above:

```json
{
  "id": "enroll-001",
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work.",
  "status": "approved",
  "createdAt": "2026-06-27T10:00:00.000Z",
  "updatedAt": "2026-06-28T09:30:00.000Z",
  "statusHistory": [
    {
      "fromStatus": null,
      "toStatus": "pending",
      "changedAt": "2026-06-27T10:00:00.000Z",
      "changedBy": "system",
      "reason": null
    },
    {
      "fromStatus": "pending",
      "toStatus": "approved",
      "changedAt": "2026-06-28T09:30:00.000Z",
      "changedBy": "reviewer@example.org",
      "reason": null
    }
  ]
}
```

## Errors

Errors use the same format as [Courses](courses.md):

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

For `INVALID_REQUEST`, `details` has one entry per invalid field. For other codes, `details` is empty.

| Status | Code | When |
| --- | --- | --- |
| `400` | `INVALID_REQUEST` | The body is missing, is not valid JSON, or is not an object; a field is missing or invalid (bad email, justification outside 20 to 500 characters, unknown `status`, empty `changedBy`, rejection without a `reason`); or the list `status` filter is not a valid status. |
| `404` | `COURSE_NOT_FOUND` | Create: no course has this `courseId`. |
| `404` | `ENROLLMENT_REQUEST_NOT_FOUND` | Get or status change: no request has this ID. |
| `409` | `COURSE_NOT_ACTIVE` | Create: the course is `draft` or `retired`. |
| `409` | `DUPLICATE_ACTIVE_REQUEST` | Create: the learner already has a `pending` or `approved` request for the course. |
| `409` | `INVALID_STATUS_TRANSITION` | Status change: the transition is not in the allowed transitions table. |

Validation runs first, so a request that is invalid and also targets a missing course or request gets a `400`.

## Examples

```bash
# Create
curl -s -X POST 'https://api.agentcourses.localhost/api/enrollment-requests' \
  -H 'Content-Type: application/json' \
  -d '{"courseId":"course-001","learnerEmail":"learner@example.org","justification":"I need this course to prepare for upcoming secure development work."}'

# List pending requests for a course
curl -s 'https://api.agentcourses.localhost/api/enrollment-requests?status=pending&courseId=course-001'

# Get one
curl -s 'https://api.agentcourses.localhost/api/enrollment-requests/enroll-001'

# Approve
curl -s -X PATCH 'https://api.agentcourses.localhost/api/enrollment-requests/enroll-001/status' \
  -H 'Content-Type: application/json' \
  -d '{"status":"approved","changedBy":"reviewer@example.org"}'

# Reject
curl -s -X PATCH 'https://api.agentcourses.localhost/api/enrollment-requests/enroll-002/status' \
  -H 'Content-Type: application/json' \
  -d '{"status":"rejected","changedBy":"reviewer@example.org","reason":"Learner has not completed the prerequisite course."}'
```
