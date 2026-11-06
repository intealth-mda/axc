---
id: traceability
title: Requirements traceability
---

## TS-A-CATALOG-SEARCH

Paths below are relative to the repository root. Acceptance scenarios live in
`packages/axc-verification/acceptance-api/src/features/courses.feature` and execute
over HTTP against the real Functions host. The docs build validates documentation.

| Requirement / criterion | Proof |
| --- | --- |
| Course model; 12 mixed fixtures | `packages/axc/persistence/src/datasources/readonly/catalog/course/course.read-repository.test.ts`: seeds twelve complete courses across all modalities and statuses |
| A1; A-AC1 | Acceptance: A-AC1 default list |
| A2; A-AC11 | Acceptance: A-AC11 keyword modality and status; A-AC11 modality status and tag |
| A3; A-AC2 | Acceptance: A-AC2 keyword covers title summary and tags |
| A4; A-AC3 | Acceptance: A-AC3 online modality |
| A5; A-AC4 | Acceptance: A-AC4 active status |
| A6; A-AC5 | Acceptance: A-AC5 case insensitive exact tag |
| A7; A-AC6 | Acceptance: A-AC1 default list; A-AC6 first page of five; A-AC6 second page; A-AC8 invalid pageSize=51 |
| A8; A-AC7 | Acceptance: A-AC1 default list; A-AC7 created date ascending; A8 updated date ascending |
| A9; A-AC8 | Acceptance: `A-AC8 invalid <query> returns the error contract`; `packages/axc/rest/src/features/courses.test.ts`: rejects %s consistently; reports all invalid fields together |
| A10; A-AC11 | Course repository, REST, query-courses unit tests and HTTP acceptance scenarios |
| A-AC9 | Acceptance: A-AC9 no matches |
| A-AC10 | Existing health.test.ts, healthcheck.feature and complete verification gate |
| A11; A-AC12 | `apps/docs/docs/courses.md`, sidebar entry, docs build |
