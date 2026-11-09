---
id: traceability
title: Requirements traceability
---

# Requirements traceability

Test paths below are repository-relative. Unit checks run with package Vitest scripts. Acceptance scenarios use Serenity over the real Functions HTTP host and run in the Stop hook. Documentation is checked by the docs build, not tests that read Markdown.

## Task Set A

| Requirement / acceptance criterion | Evidence |
| --- | --- |
| A1, A-AC1 | `rest/src/features/courses.test.ts`: parses defaults; `acceptance-api/src/features/courses.feature`: A-AC1 B-AC1 Default catalog |
| A2, A3, A-AC2 | `persistence/src/datasources/readonly/training/course/course.read-repository.test.ts`: matches keyword across title, summary and tags; HTTP scenarios A-AC2 |
| A4, A-AC3 | Course repository: applies individual and combined filters; HTTP scenario A-AC3 Modality |
| A5, A-AC4 | Course repository: applies individual and combined filters; HTTP scenario A-AC4 Active status |
| A6, A-AC5 | Course repository: applies individual and combined filters; HTTP scenario A-AC5 Case insensitive tag |
| A7, A-AC6 | Course repository: paginates, orders all sort fields, handles empty and distant pages; HTTP scenario A-AC6 Pagination |
| A8, A-AC7 | Same repository test; HTTP scenarios A-AC7 Creation date, Update date, Default title sorting |
| A9, A-AC8 | `rest/src/features/courses.test.ts`: invalid page and query matrices; `application-services/src/contexts/training/course/query-courses.test.ts`; HTTP scenarios A-AC8 |
| A10, A-AC11 | Course repository, service and REST tests; HTTP scenarios A-AC11 combined filters |
| A-AC9 | Course repository: paginates, orders all sort fields, handles empty and distant pages; HTTP scenario A-AC9 Empty result |
| A-AC10 | Existing `application-services/src/health.test.ts` and `acceptance-api/src/features/healthcheck.feature`; full verification gate |
| A11, A-AC12 | [Course API](./api/courses.md), sidebar registration; docs build |
| Course model and twelve fixtures | Course repository: returns 12 seeded courses with default pagination and all required fields |

## Task Set B

| Requirement / acceptance criterion | Evidence |
| --- | --- |
| B1, B-AC1 | All Task Set A tests above; HTTP A-AC1 B-AC1 Default catalog |
| B2, B6, B-AC2 | `application-services/src/contexts/training/enrollment-request/create.test.ts`; HTTP B-AC2 Pending creation |
| B3, B-AC3, B-AC4 | Create use case: missing/draft/retired course assertions; REST missing-course/conflict mapping; HTTP B-AC3 and B-AC4 |
| B4, B5, B-AC5 | `domain/src/domain/contexts/training/enrollment-request/enrollment-request.test.ts`: Inputs are validated at the domain boundary (19/20/500/501 bounds); create service invalid inputs; HTTP B-AC5 |
| B7, B-AC6 | Create use case: pending/approved duplicate prevention, terminal-state resubmission; `persistence/src/datasources/domain/training/enrollment-request/enrollment-request.uow.test.ts`: serializes concurrent duplicate checks across request scopes; HTTP B-AC6 |
| B8, B-AC7 | `application-services/src/contexts/training/enrollment-request/get-by-id.test.ts`; REST retrieves and lists; HTTP B-AC7 Retrieve with audit |
| B9, B-AC8 | `application-services/src/contexts/training/enrollment-request/query-requests.test.ts`; enrollment persistence filters each field and combined fields; HTTP B-AC8 |
| B10, B11, B-AC9 | Domain: Every permitted transition records an audit entry; `application-services/src/contexts/training/enrollment-request/update.test.ts`; HTTP B-AC9 |
| B12, B-AC10 | Domain: Forbidden transitions leave the aggregate unchanged (all 12 forbidden pairs); REST transition mapping; HTTP B-AC10 |
| B13, B-AC11 | Domain input validation; update use case validation; REST validation mapping; HTTP B-AC11 Missing rejection reason |
| B14, B-AC12 | Domain creation/permitted transitions audit assertions; persistence nested-copy and rollback tests; HTTP B-AC12 |
| B15, B-AC14 | All enrollment domain/service/persistence/REST tests; HTTP B-AC14 missing resources, invalid status, terminal-state resubmission |
| B16, B-AC15 | [Enrollment API](./api/enrollment-requests.md), sidebar registration; docs build |
| B17, B-AC13 | Existing health unit and HTTP acceptance tests; full verification gate |

Paths beginning with `domain/`, `persistence/`, `application-services/`, and `rest/` are under `packages/axc/`. Paths beginning with `acceptance-api/` are under `packages/axc-verification/`. Each operation feature is executed by its sibling Cucumber/Vitest test.
