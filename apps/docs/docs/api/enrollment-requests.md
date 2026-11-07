# Enrollment requests

The sample API keeps requests in process memory. Each request has `id`, `courseId`, `learnerEmail`, `justification`, `status`, `createdAt`, `updatedAt`, and `statusHistory`. Each history entry has `fromStatus`, `toStatus`, `changedAt`, `changedBy`, and `reason` (null when absent).

## Create

`POST /api/enrollment-requests` accepts JSON `{ "courseId": "course-001", "learnerEmail": "learner@example.org", "justification": "I need this course for upcoming work." }`. The course must exist and be active. Email must be valid; justification must be 20–500 characters. On success, `201` returns the complete request with `status: "pending"` and one history entry from null to pending by `system`.

Errors use `{ "error": { "code": "INVALID_REQUEST", "message": "The request could not be completed.", "details": [{ "field": "justification", "message": "justification must be between 20 and 500 characters." }] } }`. Invalid body, email, or justification returns `400 INVALID_REQUEST`; missing course returns `404 COURSE_NOT_FOUND`; inactive course returns `409 COURSE_NOT_ACTIVE`; another pending or approved request for the same course and learner returns `409 DUPLICATE_ACTIVE_REQUEST`.

## Read

`GET /api/enrollment-requests/:id` returns `200` with the complete request, including history, or `404 ENROLLMENT_REQUEST_NOT_FOUND`.

`GET /api/enrollment-requests` returns `200` with a JSON array of complete requests. Optional `status`, `courseId`, and `learnerEmail` query parameters may be combined. Invalid or repeated filters return `400 INVALID_REQUEST`.

## Change status

`PATCH /api/enrollment-requests/:id/status` accepts JSON `{ "status": "approved", "changedBy": "reviewer@example.org" }`. For rejection, include a non-empty `reason`. Valid transitions are pending to approved, rejected, or cancelled, and approved to cancelled. On success, `200` returns the complete updated request with a new history entry and updated timestamp. Invalid status or missing rejection reason returns `400 INVALID_REQUEST`; an invalid transition returns `409 INVALID_STATUS_TRANSITION`; a missing request returns `404 ENROLLMENT_REQUEST_NOT_FOUND`.
