# Task Set J — Learner Profiles with Optimistic Concurrency Requirements

Fixed specification for Task Set J. The Task Set J prompt references this file. The prompt and this specification must remain fixed for every run.

## Task definition

| Field | Value |
| --- | --- |
| Task Set ID | TS-J-LEARNER-PROFILES |
| Task Name | Learner Profiles with Optimistic Concurrency |
| Purpose | Test whether the harness can implement a create/read/update feature with validation, uniqueness, and optimistic concurrency control, plus tests and documentation. |
| Expected Difficulty | Baseline |
| Expected Scope | 3 endpoints, 1 domain model, body validation, uniqueness rule, version-guarded updates, tests, documentation |
| Primary Rubric Categories Exercised | Functional Correctness, Test and Validation Performance, Architecture and Codebase Alignment, Security and Guardrail Compliance, Context/Token/Cost Efficiency, Developer Workflow Fit |

## Business context

The sample application needs learner profiles. A learner and a coordinator may edit the same profile at the same time from different screens. A save must never silently overwrite a change the saver has not seen: every profile carries a `version`, every update must state the version it was based on, and an update based on an outdated version is refused so the client can reload and retry.

The implementation must follow the existing project structure and coding conventions. The feature must be testable without external services or production data.

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
| Production configuration | No changes to `.env`, secrets, deployment config, cloud config, or production settings |
| Authentication | Do not add or alter authentication unless the sample app already has a local test-only pattern |
| Unrelated domains | Do not change unrelated features |
| External integrations | Do not call external APIs or services |
| Dependencies | Do not add new dependencies unless clearly justified in implementation notes |

## Data model

Create a LearnerProfile model with these fields:

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | Yes | Unique learner ID, assigned by the server |
| `email` | string | Yes | Valid email; stored lowercased; unique across learners, case-insensitively |
| `displayName` | string | Yes | Stored trimmed; 2–60 characters |
| `bio` | string | Yes | 0–280 characters; `""` when omitted |
| `version` | integer | Yes | `1` on creation; increases by exactly 1 on each successful update |
| `createdAt` | string | Yes | ISO date string; never changes |
| `updatedAt` | string | Yes | ISO date string; set on creation and on each successful update |

Profiles are held for the life of the running API; there is no seed data.

## Validation rules

| Field | Rule |
| --- | --- |
| `email` | Required string, at most 254 characters, no whitespace, exactly one `@`, a non-empty part before the `@`, and a domain after it that contains at least one `.` with non-empty labels on both sides (for example `a@b.co`). |
| `displayName` | Required string, 2 to 60 characters after trimming. |
| `bio` | Optional string, at most 280 characters. |
| `version` (PUT only) | Required integer (a JSON number, not a string), 1 or more. |

Unrecognized body fields are ignored. Clients cannot set `id`, `createdAt`, or `updatedAt`, and `version` in a POST body is ignored.

## Functional requirements

| ID | Requirement |
| --- | --- |
| J1 | Add `POST /api/learners` to create a profile. A valid request returns HTTP 201 with the profile at `version` 1. |
| J2 | A POST body that breaks a validation rule, or is not valid JSON, returns HTTP 400 with error code `INVALID_REQUEST` and a `details` entry naming each invalid field. |
| J3 | Creating a profile whose email (compared case-insensitively) already belongs to another learner returns HTTP 409 with error code `DUPLICATE_LEARNER_EMAIL`. |
| J4 | Add `GET /api/learners/{id}` to retrieve a profile. An unknown id returns HTTP 404 with error code `LEARNER_NOT_FOUND`. |
| J5 | Add `PUT /api/learners/{id}` to update a profile. The body holds `email`, `displayName`, optional `bio`, and `version`. It replaces all editable fields: an omitted `bio` becomes `""`. |
| J6 | When `version` equals the stored version, the update succeeds with HTTP 200, the stored version becomes `version + 1`, `updatedAt` changes, and `id` and `createdAt` stay the same. |
| J7 | When `version` is any other integer (older or newer than the stored version), the update returns HTTP 409 with error code `VERSION_CONFLICT` and the profile is not changed. |
| J8 | Changing the email to one that belongs to another learner returns HTTP 409 with error code `DUPLICATE_LEARNER_EMAIL`. Keeping the learner's own email is allowed. |
| J9 | A PUT is checked in this order, and the first failure is returned: body validation (400 `INVALID_REQUEST`), profile exists (404 `LEARNER_NOT_FOUND`), version matches (409 `VERSION_CONFLICT`), email is unique (409 `DUPLICATE_LEARNER_EMAIL`). A rejected PUT changes nothing. |
| J10 | Add or update tests covering creation, validation, retrieval, successful updates, version increments, stale updates, duplicate email, and not found. |
| J11 | Add or update API documentation for learner profiles. |

## API contract

### Create learner profile

`POST /api/learners`

Request body:

```json
{
  "email": "Jordan.Lee@Example.org",
  "displayName": "Jordan Lee",
  "bio": "Platform engineer learning secure AI-assisted development."
}
```

Successful response (`201`):

```json
{
  "id": "learner-5c1e",
  "email": "jordan.lee@example.org",
  "displayName": "Jordan Lee",
  "bio": "Platform engineer learning secure AI-assisted development.",
  "version": 1,
  "createdAt": "2026-06-27T10:00:00.000Z",
  "updatedAt": "2026-06-27T10:00:00.000Z"
}
```

### Get learner profile by ID

```http
GET /api/learners/learner-5c1e
```

### Update learner profile

`PUT /api/learners/learner-5c1e`

Request body:

```json
{
  "email": "jordan.lee@example.org",
  "displayName": "Jordan A. Lee",
  "bio": "Platform engineer and course mentor.",
  "version": 1
}
```

Successful response (`200`):

```json
{
  "id": "learner-5c1e",
  "email": "jordan.lee@example.org",
  "displayName": "Jordan A. Lee",
  "bio": "Platform engineer and course mentor.",
  "version": 2,
  "createdAt": "2026-06-27T10:00:00.000Z",
  "updatedAt": "2026-06-27T10:05:00.000Z"
}
```

### Error response format

All errors use this format.

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "The learner profile was changed by someone else. Reload it and try again.",
    "details": [
      {
        "field": "version",
        "message": "version 1 is not the current version 2."
      }
    ]
  }
}
```

## Required error cases

| Scenario | Expected status | Expected error code |
| --- | --- | --- |
| Invalid email | 400 | `INVALID_REQUEST` |
| displayName shorter than 2 or longer than 60 characters | 400 | `INVALID_REQUEST` |
| bio longer than 280 characters | 400 | `INVALID_REQUEST` |
| PUT without `version`, or `version` not an integer of 1 or more | 400 | `INVALID_REQUEST` |
| Body is not valid JSON | 400 | `INVALID_REQUEST` |
| Learner id not found (GET or PUT) | 404 | `LEARNER_NOT_FOUND` |
| PUT `version` is not the current version | 409 | `VERSION_CONFLICT` |
| Email already used by another learner (POST or PUT) | 409 | `DUPLICATE_LEARNER_EMAIL` |

## Acceptance criteria

| ID | Acceptance criterion |
| --- | --- |
| J-AC1 | A valid `POST /api/learners` returns 201 with a server-assigned `id`, lowercased `email`, trimmed `displayName`, `bio` (`""` when omitted), `version` 1, `createdAt`, and `updatedAt`. |
| J-AC2 | `GET /api/learners/{id}` returns the stored profile. |
| J-AC3 | `GET` and `PUT` for an unknown id return 404 with `LEARNER_NOT_FOUND`. |
| J-AC4 | An invalid email, a displayName of 1 or 61 characters, or a bio of 281 characters returns 400 `INVALID_REQUEST` with a `details` entry naming the field. |
| J-AC5 | Creating a profile with an email already in use, in any letter case, returns 409 `DUPLICATE_LEARNER_EMAIL`. |
| J-AC6 | A `PUT` with the current version returns 200 with all editable fields replaced, `version` incremented by 1, and `id` and `createdAt` unchanged. |
| J-AC7 | Each successful update increments `version` by exactly 1 (1 → 2 → 3 → 4), and `GET` returns the latest version. |
| J-AC8 | A `PUT` with an older or a newer version returns 409 `VERSION_CONFLICT`, and the stored profile keeps the last successful write. |
| J-AC9 | A `PUT` without `version`, or with a non-integer or string `version`, returns 400 `INVALID_REQUEST` naming `version`, and nothing changes. |
| J-AC10 | A `PUT` that breaks a field validation rule returns 400 `INVALID_REQUEST`, and nothing changes. |
| J-AC11 | A `PUT` that changes the email to another learner's email returns 409 `DUPLICATE_LEARNER_EMAIL`, and nothing changes. |
| J-AC12 | Existing tests still pass. |
| J-AC13 | New tests cover creation, validation, retrieval, successful updates, version increments, stale updates, duplicate email, and not found. |
| J-AC14 | Documentation describes all three endpoints, request and response bodies, the version rule, and error cases. |

## Required tests

At minimum, add tests for:

| Test area | Required coverage |
| --- | --- |
| Create | Valid request returns 201 at version 1 with normalized email |
| Validation | Invalid email, displayName length, bio length, missing or invalid version |
| Duplicate email | On create and on update, case-insensitive |
| Retrieve by ID | Existing profile and unknown id |
| Update | Current version succeeds and increments version |
| Stale update | Older and newer versions return 409 and change nothing |
| Not found | GET and PUT on an unknown id |

## Required deliverables

| Deliverable | Description |
| --- | --- |
| Implementation branch | Branch or commit with all generated changes |
| Tests | Unit/integration tests for the new endpoints |
| Documentation | API documentation |
| Notes | Short summary of implementation decisions and any limitations |
| Validation output | Results from `pnpm test`, `pnpm run lint`, and `pnpm run build` (or similar) |
| Cost/usage output | Tokens, credits, or estimated cost if available |
