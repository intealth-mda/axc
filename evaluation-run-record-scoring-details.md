# Evaluation Scoring Details — Iteration 9, Task Set B

Evaluated 2026-11-06 against the feature output at `66a75d464ed77fcf19bd87530764f4538cdd931a` on `dn-oai-9-b-out`, starting from `caea84d7351f594714209a5de4b26b97c641e716`. The comparison is the Task Set B baseline on `dn-oai-0-b-out` at `ef71b54e13a30651467cb6a98f514493713b5405`, whose evaluation record scores it 67/100. The later dependency commit `ac15d16307f4293db47a1f4ce94c32cfd6993cbf` supplies the compatible install used for independent verification. This review applies all eight categories and weights in [the evaluation rubric](evaluation-category-scoring-rubric.md). It excludes the pre-existing harness `happy-dom` type mismatch from attribution to the feature output. Run and vendor categories are scored from available evidence, with missing evidence identified below.

## Score summary

| Category | Weight | Score | Weighted points |
| --- | ---: | ---: | ---: |
| Functional Correctness | 20% | 5/5 | 20 |
| Test and Validation Performance | 15% | 5/5 | 15 |
| Architecture and Codebase Alignment | 15% | 4/5 | 12 |
| Security and Guardrail Compliance | 15% | 5/5 | 15 |
| Harness Engineering Effectiveness | 10% | 4/5 | 8 |
| Context Token and Cost Efficiency | 10% | 3/5 | 6 |
| Developer Workflow Fit | 10% | 4/5 | 8 |
| Operational and Vendor Readiness | 5% | 3/5 | 3 |
| **Total** | **100%** |  | **87 / 100** |

The four feature-output categories contribute **62/65** points. The four run and readiness categories contribute **25/35** points. Recommendation: **Candidate for cage match**. This does not establish production approval or erase policy-ignored security findings.

## Baseline comparison

| Metric | `dn-oai-0-b-out` baseline | Iteration 9 | Observed change |
| --- | ---: | ---: | ---: |
| Functional requirements supported | 25/28 | 28/28 | 3 more |
| Acceptance criteria supported | 23/27 | 27/27 | 4 more |
| Full verification | Unproven; original package commands unavailable and reviewer test run stopped at sandbox port bind | Passed in compatible dependency environment | Complete evidence now available |
| Rubric score | 67/100 | 87/100 | 20 points higher |
| Total tokens | 1,625,641 | 6,578,483 | 4.05× baseline |
| Uncached input tokens | 57,135 | 113,179 | 1.98× baseline |
| Active time | 4m 38s | 16m 9s | 3.49× baseline |

The baseline used `gpt-6-sol`, an earlier starting commit, and a different dependency tree; this is a comparison of observed runs, not a controlled estimate of the harness change alone. Neither record contains actual dollar cost.

## Requirements and acceptance

- Task Set A: 11/11 functional requirements and 12/12 acceptance criteria are supported. The 12 course fixtures, case-insensitive search, individual filters, pagination, sorting, invalid-query handling, empty result, and documentation are exercised by the REST suite. A-AC11 has two separately executed combinations: `q=security&modality=online&status=active` expects exactly `course-001`, `course-006`, `course-012`; `tag=AI&status=active` expects exactly `course-010`, `course-001`, `course-005`, `course-012`. In the three-filter case, `course-004` fails only `q`, `course-002` fails only modality, and `course-003` fails only status.
- Task Set B: 17/17 functional requirements and 15/15 acceptance criteria are supported. Tests cover creation, missing/inactive courses, email and justification validation, active duplicates, retrieval, list filtering, every status transition, rejection reason, and creation/change history. The composed host ran 2/2 scenarios, including the training workflow. Rendered API headings, examples, and errors passed the documentation check.
- The assessment is a review judgment from source and executed tests. It does not assert that every acceptance criterion has its own isolated host scenario.

## Category rationale

### Functional Correctness — 5/5

All requested endpoints and material business rules are present. Course search returns complete expected IDs in the combined cases. Enrollment creation and transitions enforce course activity, input constraints, duplicate rules, and audit history. Invalid operations return stable application codes and mapped HTTP statuses. The in-memory lifetime matches the task's fixture-backed sample.

### Test and Validation Performance — 5/5

With the harness dependency compatibility fix applied, independent `pnpm run verify` passed script policy, Biome, typecheck, build, rendered docs, Knip, dependency analysis, architecture, tests, pnpm audit, and Snyk. It completed 32/32 Turbo test tasks and 2/2 host scenarios. AXC focused counts were domain 59/59, Mongoose models 4/4, persistence 10/10, application services 8/8, REST 95/95, and architecture 28/28. Persistence tests exercise adapter/converter round trips, repository creation/rehydration/save, transaction commit/rollback, racing duplicates, and defensive copies. The successful gate replayed cached Turbo tasks; the host acceptance, rendered-doc check, audit, and authorized Snyk scan ran fresh. These results establish feature compatibility in the corrected dependency environment, not that the original scored session itself finished a passing full gate.

### Architecture and Codebase Alignment — 4/5

`training` is consistent across domain, persistence, application, and REST. Course and EnrollmentRequest are modeled as Cellix aggregate roots. Enrollment has constrained values, owned history, seedwork repository and unit-of-work contracts, a storage adapter/converter, transaction-backed persistence, separate curried application operations, and transport-level HTTP mapping. The models package contains typed schemas, model factories, context registration, and focused tests; runtime storage remains in memory as the task permits. The API composition root injects data sources. A moderate placement deviation remains: `packages/axc/application-services/src/contexts/training/course/search.ts` performs filtering, sorting, and pagination after `CourseReadRepo.list()` rather than delegating those query responsibilities to the read repository. The output is understandable and tested, but this differs from the selected Cellix read-side ownership pattern.

### Security and Guardrail Compliance — 5/5

The 77-file feature diff stays within allowed feature paths, adds no secrets or production integration, and does not alter vendored Cellix source. No feature-attributable security finding was identified. On the compatible dependency tree, a fresh all-severity pnpm audit reported zero open advisories and one low plus one moderate policy-ignored finding. The user-authorized Snyk scan reported zero open and 11 ignored issues (8 high, 3 medium) across 24 projects. Policy-ignored findings remain known findings; scan success is not a claim of zero vulnerabilities. The dependency mismatch and its follow-up fix belong to the harness environment and are outside this quality score.

### Harness Engineering Effectiveness — 4/5

Against the `dn-oai-0-b-out` baseline, the engineered run improved two meaningful areas: feature quality/completeness (28/28 requirements and 27/27 criteria supported versus 25/28 and 23/27) and repeatable validation (a passing full gate, rendered-doc checks, focused persistence/REST tests, and composed host acceptance versus baseline's limited checks). The Cellix skill drove aggregate, repository, unit-of-work, model, and test structure that the baseline lacked. This meets the rubric's 4/5 band for clear improvement in at least two areas. Total tokens rose 4.05× and active time 3.49×, so speed and cost did not improve; different models, starting commits, and dependencies prevent attributing the full difference to harness engineering. These limits preclude 5/5.

### Context Token and Cost Efficiency — 3/5

The operator-supplied scored-session summary reports 6,539,803 input tokens, including 6,426,624 cached; 38,680 output tokens, including 5,924 reasoning; and 6,578,483 total. Cached input is included in input, and reasoning is included in output. The baseline used 1,625,641 total tokens, including 1,551,232 cached input; Iteration 9 used 4.05× total and 1.98× uncached input. The additional work produced a much more complete and validated result, so the extra usage is partly justified, but the rubric's low-cost or improved-cost bands are not supported by this baseline comparison. Actual dollar cost and credits are unknown, and the raw scored-session export was unavailable for independent reconciliation. This supports 3/5: a valuable result with only average demonstrated token efficiency.

### Developer Workflow Fit — 4/5

The supplied summary reports 16m 9s active and 16m 10s wall, versus the baseline's 4m 38s. The longer run produced a reviewable layered output and substantially fuller validation. The summary does **not** state a human intervention count, so zero redirects is not inferred. The time increase and incomplete intervention evidence limit the score to the rubric's good-with-minor-friction band; the baseline's shorter duration is not a like-for-like speed win because it stopped without comparable acceptance or full-gate evidence.

### Operational and Vendor Readiness — 3/5

The scored summary identifies ChatGPT Business (`self_serve_business_prolite`) and `gpt-6.1-sol`. A plausible enterprise path exists, but organizational approval, procurement terms, administrative controls, and production-use clearance were not supplied. Existing security-policy ignores also need review before a pilot decision. This matches the rubric's 3/5 band.

## Evidence and limits

| Evidence | Observation |
| --- | --- |
| Feature boundary | `git diff caea84d..66a75d4` changes 77 files under `apps/api`, `apps/docs`, `packages/axc`, and `packages/axc-verification`. The follow-up `ac15d16` changes only dependency configuration and lockfile. |
| Independent full gate | `.agents-work/ts-b-course-enrollment/verify-safe-restored.log`: `pnpm run verify` exited 0 after the compatibility fix; 25/25 typecheck tasks, 19/19 build tasks, 18/18 architecture tasks, 32/32 test tasks, and 2/2 host scenarios. Turbo marked 25/25 typecheck, 19/19 build, and 31/32 test tasks cached in this final run. |
| Security | `.agents-work/ts-b-course-enrollment/audit-safe-restored.log`: all-severity audit exited 0, 0 open, 1 low and 1 moderate policy-ignored. `.agents-work/ts-b-course-enrollment/snyk-safe-restored.log`: user-authorized scan exited 0, 24 projects, 0 open, 11 ignored. |
| Scored-session usage | Operator-supplied summary for `01a1b2d1-124f-7d81-a16f-46e548a2d087`: 6,539,803 input tokens including 6,426,624 cached; 38,680 output including 5,924 reasoning; 6,578,483 total; 16m 9s active. Raw export at `/Users/dfortun/.codex/sessions/2026/11/06/rollout-2026-11-06T16-43-28-01a1b2d1-124f-7d81-a16f-46e548a2d087.jsonl` was unavailable here, so counters could not be independently reconciled. Usage and time inform the rubric's efficiency and workflow categories with this limitation. |

The initial scored output did not itself contain the later dependency compatibility fix. This evaluation attributes the tested feature behavior to the feature output and records the environment correction separately. `git diff --check` and `git diff --cached --check` passed for the current evaluation edits.
