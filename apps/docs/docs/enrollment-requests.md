# Enrollment requests

Learners request enrollment in an active course. Reviewers approve, reject, or cancel a request. Each creation and status change appends `statusHistory`.

## Create

`POST /api/enrollment-requests`

```json
{
  "courseId": "000000000000000000000002",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work."
}
```

`200` returns the pending request:

```json
{
  "id": "000000000000000000000001",
  "courseId": "000000000000000000000002",
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

`courseId` must be an existing course with status `active`. `learnerEmail` must be an email address. `justification` must be 20 to 500 characters. A learner cannot have a second `pending` or `approved` request for the same course. A `rejected` or `cancelled` request does not block a new one.

## Read one

```http
GET /api/enrollment-requests/000000000000000000000001
```

`200` returns the same object shape as create, including `statusHistory`.

## List

```http
GET /api/enrollment-requests?status=pending&courseId=000000000000000000000002&learnerEmail=learner@example.org
```

| Query | Rule |
| --- | --- |
| `status` | Optional. `pending`, `approved`, `rejected`, or `cancelled`. |
| `courseId` | Optional. Exact course id. |
| `learnerEmail` | Optional. Exact email. |

`200` returns `{ "items": [ ... ] }`. Filters combine with and. Omitted filters are not applied.

## Update status

```http
PATCH /api/enrollment-requests/000000000000000000000001/status
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

Allowed transitions are `pending` to `approved`, `pending` to `rejected`, `pending` to `cancelled`, and `approved` to `cancelled`. Rejection requires a non-empty `reason`. `changedBy` is stored on the new history entry. Creation records `changedBy` as `system` and `fromStatus` as `null`.

## Errors

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

| Situation | HTTP | Code |
| --- | --- | --- |
| Course does not exist | 404 | `COURSE_NOT_FOUND` |
| Course is not active | 409 | `COURSE_NOT_ACTIVE` |
| Invalid email, justification, status, or missing rejection reason | 400 | `INVALID_REQUEST` |
| Duplicate pending or approved request | 409 | `DUPLICATE_ACTIVE_REQUEST` |
| Request id does not exist | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |
| Status transition is not allowed | 409 | `INVALID_STATUS_TRANSITION` |
