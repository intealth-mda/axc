# Enrollment requests

Learners request a seat in an active course. Reviewers approve, reject, or cancel that request. Course search stays at `GET /api/courses`.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/enrollment-requests` | Create a pending request. |
| `GET` | `/api/enrollment-requests/:id` | Read one request, including `statusHistory`. |
| `GET` | `/api/enrollment-requests` | List requests. Optional filters: `status`, `courseId`, `learnerEmail`. |
| `PATCH` | `/api/enrollment-requests/:id/status` | Change status. |

`201` from create and `200` from the other successful calls return the enrollment request body. Failed calls use the error body below. Full field tables, examples, and error codes are in [Enrollment request API](api/enrollment-requests).

Allowed status changes are `pending` to `approved`, `pending` to `rejected`, `pending` to `cancelled`, and `approved` to `cancelled`. Any other change returns `409` with `INVALID_STATUS_TRANSITION`. Rejection requires a non-empty `reason`. A learner cannot hold more than one `pending` or `approved` request for the same course.

The API stores requests in the in-memory catalog. It does not send mail or call another system. `changedBy` on create is `system`. A status change stores the `changedBy` value from the request body. There is no authentication check on that value.
