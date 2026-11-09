# Evaluation scoring details

Scored session: `01a1bdde-3021-7da3-a27f-5fc1c36180da`; model `gpt-6.1-sol`; Task Set B with inherited Task Set A. Evaluation uses the current uncommitted implementation at HEAD `fd9052b067b8ddfa6222307dbacf0a6223648ebc`, the raw session export, `/private/tmp/axc-b-record.md`, and matching run logs. Other temporary logs from earlier runs were excluded. The scoring rubric is unchanged. This is an agent assessment pending independent reviewer sign-off.

| Category | Weight | Score / 5 | Weighted points | Evidence and rationale |
| --- | ---: | ---: | ---: | --- |
| Functional Correctness | 20 | 5 | 20 | B1–B17 and B-AC1–15 supported by owning-layer assertions, running-host scenarios and API documentation; inherited A behavior covered. No material functional defect found in reviewed paths. |
| Test and Validation Performance | 15 | 5 | 15 | Scored final full gate passed; fresh direct feature and architecture tests also pass during evaluation. Real host covers all five feature routes and specified errors. Runtime/typecheck counts and cache replays are disclosed below. |
| Architecture and Codebase Alignment | 15 | 5 | 15 | Course and EnrollmentRequest aggregates, constrained value objects, repository/UOW contracts, adapter/converter, read repositories, schemas and layered composition follow applicable Cellix responsibilities. In-memory storage and owned history values have behavior-based deviations. |
| Security and Guardrail Compliance | 15 | 5 | 15 | No meaningful security findings; guardrails were followed. Boundary and command review found no commits, secrets, live database, real auth or production configuration changes. Security scans were not requested or run; this score does not claim unavailable scans passed. |
| Harness Engineering Effectiveness | 10 | 5 | 10 | User assessment: harness engineering clearly improved quality, cost, speed, and repeatability. Rules produced traceable architecture and verification evidence. Comparative improvement is user-supplied; no matched baseline was independently reviewed in this evaluation. |
| Context Token and Cost Efficiency | 10 | 5 | 10 | User assessment: 5,551,831 tokens and 15m 40s represent very good efficiency for the completed work. Usage reconciles across 54 calls, including substantial cached context. Dollar cost remains unknown; no matched baseline or billing evidence was independently reviewed. |
| Developer Workflow Fit | 10 | 4 | 8 | 15m 40s, no visible follow-up redirects, explicit working record and repeatable commands. Dependency setup, local host sandbox binding and a docs sidebar correction required retries. |
| Operational and Vendor Readiness | 5 | 4 | 4 | User assessment supports likely organizational approval. A score of 4 is selected within the requested 4–5 range; license, administrative controls, procurement and vendor-review details were not independently verified, so the evidence does not establish the fully documented enterprise path required for 5. |
| **Total** | **100** | | **97 / 100** | **Candidate for Pilot — confirmed by the user.** |

Weighted points = score / 5 × weight. Security hard-rule threshold is not triggered. The user confirmed the Candidate for Pilot recommendation. Missing comparison and organizational evidence remain limitations of the evaluation.

## Requirements and acceptance evidence

| Criteria | Evidence reviewed |
| --- | --- |
| A-AC1–9; B-AC1 | `application-services/src/training.test.ts` and running-host `acceptance-api/src/step-definitions/training.steps.ts`: defaults (10 of 12 fixtures), case-insensitive keyword, each filter with exact IDs, pagination, all three sorts, empty results and invalid queries/status+code. |
| A-AC11 | Two separately executed combinations: q=security + online + active → course-001/course-008; tag=ai + hybrid + active → course-006. First combination has course-004 failing only q, course-002 failing only modality, course-003 failing only status. Summary/tag-only keyword fixtures discriminate search fields. |
| B-AC2–7 | Fresh app/domain tests and host create/get verify pending state, creation fields/history, missing/draft/retired course, invalid input, pending and approved duplicates, and complete retrieval. Errors assert HTTP status and stable code through host. |
| B-AC8 | Individual status/courseId/email requests compare complete results against discriminating fixtures; additional combined-filter and normalized-email assertions. Direct app tests use explicit expected IDs. |
| B-AC9–12 | Domain tests enumerate all 16 status pairs (4 accepted, 12 rejected); host exercises all four allowed transitions, invalid transitions, rejection reasons, full audit appends and unchanged state on failed mutation. |
| A-AC10; B-AC13–14 | Final scored gate passes existing and new tests. Fresh focused evaluation confirms domain 75, schemas 4, persistence 15, application 36 reported results; fresh architecture 30. Host is two substantial feature scenarios plus health, not 15 separate acceptance scenarios. |
| A-AC12; B-AC15 | `apps/docs/docs/api/courses.md`, `enrollment-requests.md`, MADR and sidebar; operation inputs, success bodies/statuses, validation, transitions, errors and sample limitations documented; rendered-documentation gate passed. |

Acceptance accounting: B 15/15 and inherited A 12/12 supported. Functional requirements: B 17/17 and inherited A 11/11 supported. These counts overlap and must not be added as independent tests.

## Cellix alignment review

Local authority: `/Volumes/files/src/cellixjs`; selected stateful reference is `packages/ocom/{domain,persistence}/src/.../case/service-ticket/v1` (persistence directory `service-ticket-v1`), with model-context and readonly community references. The implementation record documents the full slice and test-companion review; evaluation inspected actual adapter/converter, repository/UOW and composition references against the implementation.

Course has independent persisted identity and a creation factory with modality/status value objects. Its mutation repository/UOW is deferred because no Course command exists. EnrollmentRequest is an aggregate owning transitions and audit history, using seedwork AggregateRoot, Repository and UnitOfWork contracts. History has no separate identity/lifecycle and is an owned value record. Application operations own input contracts, inject DataSources, query readonly repositories and mutate within scoped transactions. REST owns HTTP parsing/mapping; API injects the data-source factory. The training context and parent export/composition levels are consistent. Models register schema factories and supply consumed storage contracts; no empty model package or live database.

Adapter tests assert every stored field and two-entry nested history round trips, incoming and outgoing defensive copies. Repository tests prove factory/get/save and detached objects. UOW tests prove uncommitted isolation, commit, rollback by map equality, eight concurrent competing creates with exactly one success, and queue recovery. Composition tests prove shared initialized storage and detached reads. Direct app tests cover validation and duplicate concurrency. These assertions supplement host tests rather than relying on HTTP success alone.

Documented deviations: in-memory records and serialized cloned transactions replace Mongo sessions/ObjectIds/population; reference converter/repository/UOW responsibilities remain. Authorization policies, events and versioned subtypes are inapplicable to the sample behavior. Durable Mongo adoption would require replacing storage adapters/repositories/UOW and adding cross-process uniqueness. No unexplained structural defect found. Exhaustive transition assertions and discriminating filter fixtures provide targeted fault evidence; mutation tooling was not run. Alignment completion is supported by the scored gate and fresh focused checks; sample restart/multi-worker limitations remain.

## Verification provenance

Scored run final command, exit 0, after final docs fix:

```sh
node scripts/check-script-policy.mjs && pnpm exec biome check . && pnpm run typecheck && pnpm run build && pnpm run docs:check && pnpm run knip && pnpm run e18e && pnpm run test:arch && pnpm run test
```

Source: `/private/tmp/axc-b-verification-final.log`. Typecheck 25/25 tasks cached; build 19/19 with 18 cached; docs 4/4 with 3 cached; architecture 18/18 with 16 cached; tests 31/31 with 17 cached. Final test log reports 670 Vitest results (including runtime/typecheck projects), plus host 3/3. Separate architecture stage reports AXC 30 and Cellix 10; docs node tests 3. These are reported results, not unique runtime test cases. Scored fresh direct feature and AXC architecture tests were also recorded independently of Turbo.

Evaluation direct commands, Node 24.21.0 and pnpm 11.11.0, all exit 0:

```sh
pnpm --filter @axc/domain test
pnpm --filter @axc/data-sources-mongoose-models test
pnpm --filter @axc/persistence test
pnpm --filter @axc/application-services test
pnpm --filter @axc-verification/archunit-tests test:arch
```

Fresh reported totals: 75, 4, 15, 36 and 30 respectively. Logs: `/private/tmp/axc-eval-11-{domain,data-sources-mongoose-models,persistence,application-services,arch}.log`. REST has no package test script; host scenarios provide transport acceptance.

Evaluation full gate: **exit 0**, all nine stages executed, log `/private/tmp/axc-eval-11-gate-elevated.log`. Test pipeline: 31 successful tasks, 30 cached; the acceptance task ran fresh and passed 3/3 scenarios (2 feature + health). Cached feature/architecture results in this pipeline are supplemented by the fresh direct commands above. No stages remain unexecuted. First sandbox gate reached test/acceptance and failed because the API host could not bind locally; it is a failed run, not passing evidence. Log: `/private/tmp/axc-eval-11-gate.log`. Same command retried with required sandbox elevation; no guardrail or acceptance check weakened.

Knip has configuration hints without actionable findings; no comparable pre-install baseline was available. e18e exit 0 in required quiet mode does not establish zero issues. Audit, Snyk and secret/security scans were not requested or executed; no unavailable security check is counted as passed.

## Usage, elapsed time and comparison limits

Raw export: `/Users/duynguyen/.codex/sessions/2026/11/08/rollout-2026-11-08T20-13-37-01a1bdde-3021-7da3-a27f-5fc1c36180da.jsonl`. `node scripts/session-usage.mjs <export>` reconciles 54 per-call records with final cumulative totals: input 5,513,596; cached input 5,412,864; cache-write input 0; output 38,235; reasoning output 4,018; total 5,551,831. Uncached input is 100,732. Cached input is included in input, reasoning in output; neither is added again. These totals include the scored run's final calls/response and exclude this evaluation. Earlier working-record snapshots are partial and superseded.

The checkout's usage script does not support the workflow's `--timeline` option (exit 2); the supported invocation succeeds. No script was modified. Live phase counters were not captured, so phase costs and causal attribution remain unknown. No matched baseline supports speed, token or harness-improvement ratios. Cost, credits and license remain unavailable; no estimate inferred from token totals. Active/wall timing comes from supplied metadata, not reconstructed billing time. Export contains one task prompt and no subsequent human redirects; no subagent call observed. Tool retries/approvals are not automatically human interventions.

## Scope and remaining limitations

Initial evaluation snapshot: branch dn-oai-11 at the stated HEAD, 14 tracked modifications, 61 implementation untracked files plus the two evaluation support files. No staged changes. Evaluation edits only the run record and this scoring file; the provided scoring rubric remains unchanged. Fixed requirements/prompts, README, scaffold, vendored Cellix, production/auth/environment and root tool configuration remain untouched. The lockfile's two MongoDB transitive resolutions are disclosed scope churn, not a claimed feature requirement. No staging, commits or pushes.

Requests are worker-local and reset on restart; multiple workers do not coordinate uniqueness. changedBy is an unverified sample audit label. These are documented sample constraints. Review and organizational readiness remain pending; provisional score is not a production recommendation.

Final working-tree and staged whitespace checks (`git diff --check`, `git diff --cached --check`) passed. Evaluation changes are confined to the two completed evaluation files; implementation changes were preserved.
