# Task Set L — Feature Task Requirements

Fixed specification for Task Set L. The Task Set L prompt references this file. The prompt and this specification must remain fixed for every run.

## Task definition

| Field | Value |
| --- | --- |
| Task Set ID | TS-L-STATUS-HISTORY-CSV |
| Task Name | Enrollment Request Status History CSV Export |
| Purpose | Test whether the harness can add a non-JSON endpoint to an existing API with an exact output format, error handling, tests, and documentation. |
| Expected Difficulty | Maintenance |
| Expected Scope | 1 new endpoint, CSV serialization, routing, tests, documentation |
| Primary Rubric Categories Exercised | Functional Correctness, Test and Validation Performance, Architecture and Codebase Alignment, Context/Token/Cost Efficiency, Developer Workflow Fit |

## Business context

Enrollment requests keep an audit trail in `statusHistory`. Reviewers and auditors need to download that trail for one request as a CSV file they can open in a spreadsheet or attach to an audit record. The export must contain exactly what the audit trail holds, in a fixed and predictable format.

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
| `packages/axc/**` | Do not create any additional top-level directories beyond what already exist |
| `packages/axc-verification/**` | Unit, integration, architectural, and acceptance tests |
| `apps/docs/**` | MADR / API documentation |

## Do not modify

The harness must not modify:

| Area | Rule |
| --- | --- |
| Production configuration | No production settings, secrets, deployment, or environment changes |
| Authentication | Do not add real authentication; use existing sample/test conventions only |
| Existing endpoints | Existing routes, request bodies, and JSON responses stay unchanged |
| External integrations | No calls to external systems |
| Dependencies | Do not add dependencies (a CSV library is not needed) unless clearly justified |

## CSV format

| Field | Value |
| --- | --- |
| Endpoint | `GET /api/enrollment-requests/:id/history.csv` |
| Status | `200` |
| `Content-Type` | `text/csv; charset=utf-8` |
| `Content-Disposition` | `attachment; filename="enrollment-request-<id>-history.csv"`, where `<id>` is the request id |
| Header row | `changedAt,fromStatus,toStatus,changedBy,reason` |
| Data rows | One row per `statusHistory` entry, in `statusHistory` order (oldest first), including the creation entry |
| Column values | The entry's `changedAt`, `fromStatus`, `toStatus`, `changedBy`, `reason`, unchanged |
| Null values | Written as an empty field |
| Quoting | A field is enclosed in double quotes only if it contains a comma, a double quote, a carriage return, or a line feed. A double quote inside a quoted field is written as two double quotes. No other field is quoted. |
| Line endings | Every line, including the header and the last row, ends with CRLF (`\r\n`) |
| Encoding | UTF-8, no byte order mark |

### Example

A request created, approved, then cancelled with the reason `Schedule conflict, "Q3" cohort` exports as (each line ends with CRLF):

```csv
changedAt,fromStatus,toStatus,changedBy,reason
2026-06-27T10:00:00.000Z,,pending,system,
2026-06-28T09:00:00.000Z,pending,approved,reviewer@example.org,
2026-06-29T09:00:00.000Z,approved,cancelled,reviewer@example.org,"Schedule conflict, ""Q3"" cohort"
```

The same request as returned by `GET /api/enrollment-requests/:id`:

```json
{
  "id": "4f1c0b9e-6f0a-4a43-9a51-3f3b2f7d9c10",
  "courseId": "course-001",
  "learnerEmail": "learner@example.org",
  "justification": "I need this course to prepare for upcoming secure development work.",
  "status": "cancelled",
  "createdAt": "2026-06-27T10:00:00.000Z",
  "updatedAt": "2026-06-29T09:00:00.000Z",
  "statusHistory": [
    { "fromStatus": null, "toStatus": "pending", "changedAt": "2026-06-27T10:00:00.000Z", "changedBy": "system", "reason": null },
    { "fromStatus": "pending", "toStatus": "approved", "changedAt": "2026-06-28T09:00:00.000Z", "changedBy": "reviewer@example.org", "reason": null },
    { "fromStatus": "approved", "toStatus": "cancelled", "changedAt": "2026-06-29T09:00:00.000Z", "changedBy": "reviewer@example.org", "reason": "Schedule conflict, \"Q3\" cohort" }
  ]
}
```

## Functional requirements

| ID | Requirement |
| --- | --- |
| L1 | Add `GET /api/enrollment-requests/:id/history.csv`. |
| L2 | Respond `200` with the `Content-Type` and `Content-Disposition` headers from the CSV format. |
| L3 | The first line is the header row `changedAt,fromStatus,toStatus,changedBy,reason`. |
| L4 | Write one data row per `statusHistory` entry in `statusHistory` order, including the creation entry. |
| L5 | Write `null` values as empty fields. |
| L6 | Quote fields exactly as the quoting rule states. |
| L7 | End every line, including the last, with CRLF. |
| L8 | An unknown id returns `404` with code `ENROLLMENT_REQUEST_NOT_FOUND` in the JSON error format. |
| L9 | Existing endpoints and responses are unchanged. |
| L10 | Add tests for the export. |
| L11 | Document the endpoint, its headers, columns, and quoting rule in the enrollment requests documentation, including the header row. |
| L12 | Existing tests must still pass. |

## API contract

### Request

```http
GET /api/enrollment-requests/4f1c0b9e-6f0a-4a43-9a51-3f3b2f7d9c10/history.csv
```

### Successful response

See "CSV format" and its example.

### Error response

```json
{
  "error": {
    "code": "ENROLLMENT_REQUEST_NOT_FOUND",
    "message": "Enrollment request missing-id was not found.",
    "details": []
  }
}
```

## Required error cases

| Scenario | Expected status | Expected error code |
| --- | --- | --- |
| Request not found | 404 | `ENROLLMENT_REQUEST_NOT_FOUND` |

## Acceptance criteria

| ID | Acceptance criterion |
| --- | --- |
| L-AC1 | `GET /api/enrollment-requests/:id/history.csv` for an existing request returns 200 with `Content-Type` `text/csv`. |
| L-AC2 | The first line is exactly `changedAt,fromStatus,toStatus,changedBy,reason`. |
| L-AC3 | There is one data row per `statusHistory` entry, in order, with values equal to the get-by-id response. |
| L-AC4 | `null` values are empty fields: the creation row has an empty `fromStatus` and an empty `reason`. |
| L-AC5 | Fields with a comma, a double quote, or a line feed are quoted with inner quotes doubled; other fields are not quoted. |
| L-AC6 | Every line, including the last, ends with CRLF. |
| L-AC7 | `Content-Disposition` is `attachment; filename="enrollment-request-<id>-history.csv"`. |
| L-AC8 | An unknown id returns 404 `ENROLLMENT_REQUEST_NOT_FOUND` in the JSON error format. |
| L-AC9 | Existing JSON endpoints are unchanged (get by id and list still return JSON with `statusHistory`). |
| L-AC10 | Enrollment request documentation describes `/history.csv` and its header row. |
| L-AC11 | Existing tests still pass. |

## Required tests

At minimum, add tests for:

| Test area | Required coverage |
| --- | --- |
| Header | Exact header row |
| Rows | One row per history entry, in order, including the creation entry |
| Empty fields | `null` `fromStatus` and `reason` |
| Quoting | Comma, double quote, and line feed in a field |
| Line endings | CRLF on every line |
| Response headers | `Content-Type` and `Content-Disposition` |
| Not found | Unknown id returns 404 |
| Existing tests | Previously existing tests still pass |

## Required deliverables

| Deliverable | Description |
| --- | --- |
| Implementation branch | Branch or commit with all generated changes |
| Implementation | CSV export endpoint, routing, and serialization |
| Tests | Unit/integration tests for the export |
| Documentation | Updated enrollment requests documentation |
| Notes | Short implementation summary, assumptions, and limitations |
| Validation output | Results from `pnpm test`, `pnpm run lint`, and `pnpm run build` (or similar) |
| Cost/usage output | Tokens, credits, or estimated cost if available |
