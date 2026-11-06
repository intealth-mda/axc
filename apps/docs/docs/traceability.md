---
id: traceability
---

# Requirement traceability

## TS-A-CATALOG-SEARCH

Paths below are relative to the repository root. Unit tests are executed by each package's `test` script. HTTP acceptance scenarios run through the real Azure Functions host in the Stop hook. Documentation is validated by the docs build; existing regression tests run in verify.

| Requirement / acceptance criterion | Evidence |
| --- | --- |
| Course model fields | `packages/axc/domain/src/domain/contexts/catalog/course/course.entity.ts`; persistence test “seeds twelve complete unique courses with mixed values” |
| At least 12 mixed fixture courses | `packages/axc/persistence/src/seed/catalog/course.ts`; persistence test “seeds twelve complete unique courses with mixed values” |
| A1 / A-AC1 Endpoint, defaults | `packages/axc-verification/acceptance-api/src/features/courses.feature`: “A-AC1 Default pagination”; REST test “returns the page and parses defaults” |
| A2 Matching filters | Acceptance “A-AC11 Keyword modality and status combine” and “A-AC11 Tag and status combine”; persistence “filters %j” |
| A3 / A-AC2 Keyword search | Acceptance “A-AC2 Keyword matches title summary and tags ignoring case”; persistence “searches title, summary and tags without case sensitivity” |
| A4 / A-AC3 Modality | Acceptance “A-AC3 Online modality”; domain “accepts all enumerated values and maximum pagination” |
| A5 / A-AC4 Status | Acceptance “A-AC4 Active status”; domain “accepts all enumerated values and maximum pagination” |
| A6 / A-AC5 Tags | Acceptance “A-AC5 Case insensitive tag”; persistence “filters %j” includes exact-tag behavior |
| A7 / A-AC6 Pagination | Acceptance “A-AC6 Explicit pagination”, “A-AC6 Second page”, “A-AC7 Creation date sorting” (maximum size); persistence “paginates after filtering and counts the whole result” |
| A8 / A-AC7 Sorting | Acceptance “A-AC7 Creation date sorting”, “A8 Updated date sorting”, “A-AC1 Default pagination”; persistence “sorts ascending by %s” and “breaks sort ties by id” |
| A9 / A-AC8 Validation | Acceptance outline “A-AC8 Invalid query parameters”; REST “rejects %s consistently” and “reports all validation problems together”; domain “collects every invalid field” |
| A-AC9 No matches | Acceptance “A-AC9 No matching courses”; persistence “returns empty results and out of range pages” |
| A10 / A-AC11 Test coverage | The above acceptance scenarios; unit suites `course.test.ts`, `course.read-repository.test.ts`, `query-courses.test.ts`, `courses.test.ts` |
| A-AC10 Regression | Existing application-services `src/health.test.ts`; acceptance `src/features/healthcheck.feature`; full Stop-hook verify suite |
| A11 / A-AC12 Documentation | `apps/docs/docs/courses.md`, registered in `apps/docs/sidebars.ts`, checked by the docs build |

Unit file locations:

- `packages/axc/domain/src/domain/contexts/catalog/course/course.test.ts`
- `packages/axc/persistence/src/datasources/readonly/catalog/course/course.read-repository.test.ts`
- `packages/axc/application-services/src/contexts/catalog/course/query-courses.test.ts` runs `features/query-courses.feature`, proving direct-call validation and read-repository delegation.
- `packages/axc/rest/src/features/courses.test.ts`

The persistence “copies objects and tags on read” test proves fixture isolation. The REST “parses all filters and forwards authorization” test proves parsing and factory delegation.
