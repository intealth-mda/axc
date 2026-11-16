# Task Set E — Course Capacity Requirements

Fixed specification for Task Set E. The Task Set E prompt references this file. The prompt and this specification must remain fixed for every run.

## Task definition

| Field | Value |
| --- | --- |
| Task Set ID | TS-E-COURSE-CAPACITY |
| Task Name | Course Capacity |
| Purpose | Test whether the harness can extend an existing feature with a new field, a derived read endpoint, and a new business rule inside an existing workflow, without regressing current behavior. |
| Expected Difficulty | Expanded |
| Expected Scope | 1 new field on an existing model, 1 new endpoint, 1 new rule in an existing status transition, tests, documentation |
| Primary Rubric Categories Exercised | All rubric categories |

## Starting point

The codebase already implements:

| Feature | Endpoints |
| --- | --- |
| Course search | `GET /api/courses` with `q`, `modality`, `status`, `tag`, `page`, `pageSize`, `sort` |
| Enrollment requests | `POST /api/enrollment-requests`, `GET /api/enrollment-requests`, `GET /api/enrollment-requests/{id}`, `PATCH /api/enrollment-requests/{id}/status` |

The existing behavior of these endpoints, including their validation, error codes, and status transitions (`pending` → `approved`, `rejected`, or `cancelled`; `approved` → `cancelled`), must be preserved.

## Business context

Courses have a limited number of seats. Coordinators need to see how many seats a course has, how many are taken, and how many requests are still waiting. A reviewer must not be able to approve more learners than a course can hold. A seat is taken only by an approved request; pending requests do not hold seats, and cancelling an approved request gives its seat back.

## Allowed write boundary

The harness may create or modify files only in these locations:

| Path | Purpose |
| --- | --- |
| `apps/api/**` | REST routing / functional wiring |
| `packages/axc/rest/**` | Hono logic |
| `packages/axc/application-services/**` | Application services |
| `packages/axc/domain/**` | DDD domain logic |
| `packages/axc/persistence/**` | Data storage |
| `packages/axc/service-mongoose/**` | Data storage |
| `packages/axc/**` | Do not create any additional directories beyond what already exist |
| `packages/axc-verification/**` | Unit, integration, architectural, and acceptance tests |
| `apps/docs/**` | MADR / API documentation |

## Do not modify

The harness must not modify:

| Area | Rule |
| --- | --- |
| Production configuration | No production settings, secrets, deployment, or environment changes |
| Authentication | Do not add real authentication; use existing sample/test conventions only |
| External integrations | No calls to external systems |
| Database infrastructure | Do not introduce a real database if the sample app uses in-memory or file-based fixtures |
| Unrelated domains | Do not change unrelated features |
| Dependencies | Do not add dependencies unless clearly justified |

## Domain models

### Course

Add one field to the existing Course model.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `capacity` | integer | Yes | Number of seats; 1 or more |

Set the seeded courses to exactly these capacities. Their other fields do not change.

| Course `id` | Course `status` | `capacity` |
| --- | --- | --- |
| `course-001` | `active` | 2 |
| `course-002` | `active` | 1 |
| `course-003` | `draft` | 15 |
| `course-004` | `retired` | 20 |
| `course-005` | `active` | 3 |
| `course-006` | `active` | 25 |

### CourseAvailability

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `courseId` | string | Yes | The course ID |
| `capacity` | integer | Yes | The course's capacity |
| `approvedCount` | integer | Yes | Number of the course's requests with status `approved` |
| `pendingCount` | integer | Yes | Number of the course's requests with status `pending` |
| `seatsLeft` | integer | Yes | `capacity - approvedCount`, never below 0 |

## Functional requirements

| ID | Requirement |
| --- | --- |
| E1 | Add `capacity` to Course, with the seed values in the table above. |
| E2 | Every course returned by `GET /api/courses` includes `capacity`. |
| E3 | Add `GET /api/courses/{id}/availability` returning the CourseAvailability for any existing course, whatever its status. |
| E4 | `GET /api/courses/{id}/availability` for an unknown course returns HTTP 404 with error code `COURSE_NOT_FOUND`. |
| E5 | `approvedCount`, `pendingCount`, and `seatsLeft` reflect the current enrollment requests at the time of the call. Rejected and cancelled requests are not counted. |
| E6 | `PATCH /api/enrollment-requests/{id}/status` with `status` = `approved` returns HTTP 409 with error code `COURSE_FULL` when the request's course has no seats left (`approvedCount >= capacity`). The request keeps its status and no `statusHistory` entry is added. |
| E7 | The transition rule is checked before the capacity rule: an approval that is not a valid transition still returns `INVALID_STATUS_TRANSITION`. |
| E8 | Cancelling an approved request frees its seat, so another pending request for the course can then be approved. |
| E9 | Capacity limits approvals only. Creating a request for a full active course still succeeds as `pending`, and rejecting or cancelling requests is unaffected. |
| E10 | All existing course search and enrollment request behavior is preserved. |
| E11 | Add or update tests for capacity on courses, availability counts, the full-course rule, seat release on cancellation, and not found. |
| E12 | Add or update API documentation for courses and enrollment requests. |
| E13 | Existing tests must still pass. |

## API contracts

### Course search response item

`GET /api/courses` items gain `capacity`:

```json
{
  "id": "course-001",
  "title": "AI Security Foundations",
  "summary": "Introductory course on secure AI-assisted development.",
  "modality": "online",
  "status": "active",
  "tags": ["ai", "security"],
  "capacity": 2,
  "createdAt": "2026-01-15T00:00:00.000Z",
  "updatedAt": "2026-06-01T00:00:00.000Z"
}
```

### Get course availability

```http
GET /api/courses/course-005/availability
```

Successful response (`200`):

```json
{
  "courseId": "course-005",
  "capacity": 3,
  "approvedCount": 1,
  "pendingCount": 1,
  "seatsLeft": 2
}
```

### Approve a request for a full course

`PATCH /api/enrollment-requests/{id}/status`

Request body:

```json
{
  "status": "approved",
  "changedBy": "reviewer@example.org"
}
```

Response (`409`):

```json
{
  "error": {
    "code": "COURSE_FULL",
    "message": "Course course-002 has no seats left.",
    "details": [
      {
        "field": "status",
        "message": "course-002 has 0 of 1 seats left."
      }
    ]
  }
}
```

### Error response format

Use the existing error format.

```json
{
  "error": {
    "code": "COURSE_NOT_FOUND",
    "message": "Course course-999 was not found.",
    "details": []
  }
}
```

## Required error cases

| Scenario | Expected status | Expected error code |
| --- | --- | --- |
| Availability for an unknown course | 404 | `COURSE_NOT_FOUND` |
| Approving when the course has no seats left | 409 | `COURSE_FULL` |
| Approving a request that is not `pending` | 409 | `INVALID_STATUS_TRANSITION` |
| All existing enrollment request error cases | unchanged | unchanged |

## Acceptance criteria

| ID | Acceptance criterion |
| --- | --- |
| E-AC1 | `GET /api/courses` returns every seeded course with the `capacity` given in this specification. |
| E-AC2 | `GET /api/courses/course-005/availability` with no requests returns `capacity` 3, `approvedCount` 0, `pendingCount` 0, `seatsLeft` 3. |
| E-AC3 | `GET /api/courses/{id}/availability` for an unknown course returns 404 with `COURSE_NOT_FOUND`. |
| E-AC4 | After two requests are created for a course and one is approved, availability shows `approvedCount` 1, `pendingCount` 1, and `seatsLeft` one less than capacity. |
| E-AC5 | Approving a request for a course with no seats left returns 409 `COURSE_FULL`; the request stays `pending` with no new `statusHistory` entry. |
| E-AC6 | Cancelling an approved request frees its seat: another pending request for the course can then be approved, and availability shows the updated counts. |
| E-AC7 | For a full course, creating a new request still returns 201 `pending`, and rejecting or cancelling a pending request still succeeds. |
| E-AC8 | Existing enrollment request behavior is unchanged: valid creation, duplicate prevention, invalid transitions, and rejection without a reason return the same results as before. |
| E-AC9 | Existing course search behavior is unchanged: filters, pagination metadata, and invalid query parameters return the same results as before. |
| E-AC10 | Existing tests still pass. |
| E-AC11 | New tests cover capacity on courses, availability counts, the full-course rule, seat release on cancellation, and not found. |
| E-AC12 | Documentation describes `capacity`, the availability endpoint and its fields, and the `COURSE_FULL` error. |

## Required tests

At minimum, add tests for:

| Test area | Required coverage |
| --- | --- |
| Course capacity | Course search items include `capacity` |
| Availability | Counts with no requests, with pending and approved requests, and after cancellation |
| Not found | Availability for an unknown course |
| Full course | Approving when no seats are left returns 409 `COURSE_FULL` and changes nothing |
| Seat release | Cancelling an approved request allows another approval |
| Unaffected actions | Creating, rejecting, and cancelling on a full course |
| Regression | Existing course search and enrollment request tests still pass |

## Required deliverables

| Deliverable | Description |
| --- | --- |
| Implementation branch | Branch or commit with all generated changes |
| Implementation | Domain, endpoint, rule, repository/service, mapper changes |
| Tests | Unit/integration tests for capacity, availability, and the full-course rule |
| Documentation | Updated course and enrollment request API documentation |
| Notes | Short implementation summary, assumptions, and limitations |
| Validation output | Results from `pnpm test`, `pnpm run lint`, and `pnpm run build` (or similar) |
| Cost/usage output | Tokens, credits, or estimated cost if available |
