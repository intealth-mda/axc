# Enrollment request API

Base path: `/api/enrollment-requests`.

A request references one course. The course must already exist and have `status` `active`. New requests start as `pending`. Each create and status change appends one `statusHistory` entry.

## Enrollment request body

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | Assigned by the API, for example `enroll-001`. |
| `courseId` | string | Yes | Existing course id. |
| `learnerEmail` | string | Yes | Email address. |
| `justification` | string | Yes | 20 to 500 characters. |
| `status` | string | Yes | `pending`, `approved`, `rejected`, or `cancelled`. |
| `createdAt` | string | Yes | ISO-8601. |
| `updatedAt` | string | Yes | ISO-8601. |
| `statusHistory` | array | Yes | Oldest entry first. |

### Status history entry

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `fromStatus` | string or null | Yes | `null` on the creation entry. |
| `toStatus` | string | Yes | Status after the change. |
| `changedAt` | string | Yes | ISO-8601. |
| `changedBy` | string | Yes | `system` on create. Caller-supplied on a status change. |
| `reason` | string or null | Yes | Required in the request when moving to `rejected`. Otherwise `null` when omitted. |

## Create

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

`201` returns the enrollment request. The first history entry has `fromStatus: null`, `toStatus: "pending"`, `changedBy: "system"`, and `reason: null`.

A second `pending` or `approved` request for the same learner and course returns `409`. Matching email is case-insensitive. A `rejected` or `cancelled` request does not block a new one.

## Read one

```http
GET /api/enrollment-requests/enroll-001
```

`200` returns the same object as create, including `statusHistory`. An unknown id returns `404`.

## List

```http
GET /api/enrollment-requests?status=pending&courseId=course-001&learnerEmail=learner@example.org
```

Every filter is optional. Filters that are present are combined. `200` returns a JSON array of enrollment requests. An empty array means nothing matched.

| Query | Rule |
| --- | --- |
| `status` | `pending`, `approved`, `rejected`, or `cancelled`. |
| `courseId` | Exact course id. |
| `learnerEmail` | Exact email, case-insensitive. |

Unknown query parameters, a repeated parameter, or a bad `status` return `400`.

## Change status

```http
PATCH /api/enrollment-requests/enroll-001/status
Content-Type: application/json
```

Approve or cancel:

```json
{
  "status": "approved",
  "changedBy": "reviewer@example.org"
}
```

Reject:

```json
{
  "status": "rejected",
  "changedBy": "reviewer@example.org",
  "reason": "Learner has not completed the prerequisite course."
}
```

| Field | Rule |
| --- | --- |
| `status` | `pending`, `approved`, `rejected`, or `cancelled`. |
| `changedBy` | Non-empty reviewer or operator id. |
| `reason` | Required and non-empty when `status` is `rejected`. |

`200` returns the updated request. `statusHistory` grows by one entry.

Valid transitions:

| From | To |
| --- | --- |
| `pending` | `approved`, `rejected`, `cancelled` |
| `approved` | `cancelled` |

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

| Situation | HTTP | `error.code` |
| --- | --- | --- |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Course is draft or retired | 409 | `COURSE_NOT_ACTIVE` |
| Invalid email, justification, status, or missing rejection reason | 400 | `INVALID_REQUEST` |
| Duplicate pending or approved request | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Request id does not exist | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Status change is not one of the valid transitions | 409 | `INVALID_STATUS_TRANSITION` |

`details` lists every invalid field on a `400`. Field order is not significant. Length `20` and `500` are accepted. Length `19` and `501` are rejected.
