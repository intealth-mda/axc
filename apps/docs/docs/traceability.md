---
id: traceability
title: Requirements traceability
---

## TS-A-CATALOG-SEARCH

Paths below are relative to the repository root. Unit tests run via each package's `test` script; HTTP acceptance scenarios run through the real Functions host in the verification gate.

| Requirement / criterion | Evidence |
| --- | --- |
| Course model and 12 mixed fixtures | `packages/axc/domain/src/domain/contexts/catalog/course/course.entity.ts`; persistence `course.read-repository.test.ts`: contains twelve complete unique fixtures with mixed values |
| A1, A-AC1 | `packages/axc-verification/acceptance-api/src/features/courses.feature`: A-AC1 Default paginated course list |
| A2 | Acceptance A-AC11 combined filter scenarios; persistence filter tests |
| A3, A-AC2 | Acceptance A-AC2; persistence matches keyword in title, summary and tags case insensitively |
| A4, A-AC3 | Acceptance A-AC3; persistence filters modality (all three values) |
| A5, A-AC4 | Acceptance A-AC4; persistence filters status (all three values) |
| A6, A-AC5 | Acceptance A-AC5; persistence matches whole tags ignoring case |
| A7, A-AC6 | Acceptance A-AC6 Explicit pagination and Second page; REST accepts maximum pageSize and safe large pages; persistence paginates after filtering with exact totals |
| A8, A-AC7 | Acceptance A-AC7 Supported ascending sort fields; persistence sorts ascending and breaks ties by id |
| A9, A-AC8 | Acceptance A-AC8 Invalid query values; REST rejects invalid parameters and collects every validation problem; application service Rejecting invalid searches before accessing storage |
| A10, A-AC11 | Acceptance A-AC11 Keyword modality and status combined, Tag and modality combined; REST, persistence and application-service test suites |
| A-AC9 | Acceptance A-AC9 No matching courses; persistence returns no matches with zero pages |
| A-AC10 | Existing `application-services/src/health.test.ts` and acceptance `healthcheck.feature`; full verify gate runs existing suites |
| A11, A-AC12 | `apps/docs/docs/courses.md` (endpoint, parameters, success/error contracts); docs build validates this page |

Unit test files: `packages/axc/persistence/src/datasources/readonly/catalog/course/course.read-repository.test.ts`, `packages/axc/rest/src/features/courses.test.ts`, `packages/axc/application-services/src/contexts/catalog/course/query-courses.test.ts` (executes sibling `features/query-courses.feature`).
