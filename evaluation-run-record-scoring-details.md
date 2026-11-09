# Evaluation scoring details — course catalog search

Session `01a1be0a-3db1-7ec1-bab0-069bb7b93dac`, model `gpt-6.1-sol`, Task Set A. Evaluation performed November 8, 2026, America/New_York. This is an automated, provisional assessment under [the category rubric](evaluation-category-scoring-rubric.md); it does not fill the reserved human reviewer fields in [the run record](evaluation-run-record.md).

| Category | Weight | Score / 5 | Weighted points | Evidence and rationale |
| --- | ---: | ---: | ---: | --- |
| Functional Correctness | 20 | 5 | 20 | All A1–A11 requirements and A-AC1–A-AC12 satisfied. Twelve fixtures, complete DTOs, independent and combined filters, pagination, three sorts, empty results, and consistent invalid-query responses are exercised. |
| Test and Validation Performance | 15 | 5 | 15 | Fresh direct package and architecture evidence in the scored run, fresh running-host feature scenarios, and passing required gate. Evaluation repeated the gate successfully with local-host permission. Cache replays are identified below. |
| Architecture and Codebase Alignment | 15 | 5 | 15 | Course AggregateRoot and value objects reuse Cellix seedwork; layered catalog/course composition, application-owned contracts, injected read repository, connected model validation, thin transport, and scoped API wiring follow the applicable references. Read-only omissions are justified below. |
| Security and Guardrail Compliance | 15 | 5 | 15 | Scoped diff and session review found no meaningful guardrail violation, unsafe feature dependency, or prohibited tracked modification. Supply-chain policy preserved. Score reflects inspected guardrails, not an independent security certification; user-owned scans are excluded. |
| Harness Engineering Effectiveness | 10 | 2 | 4 | Rules produced auditable layered work and discriminating evidence, but no matched baseline demonstrates improvement. Conservative provisional score: improvement remains unproven; this is not a finding that the harness caused worse results. |
| Context Token and Cost Efficiency | 10 | 3 | 6 | Complete result in approximately 12 minutes, with controlled, reconciled usage: 104,569 uncached input and 23,863 output, alongside 4,999,552 cached input. Aggregate context is substantial; no matched comparison or monetary cost establishes superior value. Score uses measured token usage rather than an invented price. |
| Developer Workflow Fit | 10 | 4 | 8 | Completed without substantive follow-up redirection; concise final report and explicit limitations. Install, test-config, formatting/Knip, and sandbox retries caused minor friction. Approval interactions are not fully observable. |
| Operational and Vendor Readiness | 5 | 2 | 2 | Sample/training run is demonstrated. Actual license, administrative controls, retention terms, procurement, and production approval are unverified. No inference from the model provider or rate-limit label. |
| **Total** | **100** | | **85 / 100** | **Continue.** Gather comparison, cost, and operational evidence before considering a pilot. |

Weighted points = score / 5 × weight. The security hard rule is not triggered. Strong feature evidence does not establish a production approval path. Scores for harness effectiveness, efficiency, and readiness should be revisited when the missing evidence becomes available.

## Scope and evidence sources

- Scored export: `/Users/duynguyen/.codex/sessions/2026/11/08/rollout-2026-11-08T21-01-44-01a1be0a-3db1-7ec1-bab0-069bb7b93dac.jsonl`.
- Implementation branch `dn-oai-11`, starting/current HEAD `fd9052b067b8ddfa6222307dbacf0a6223648ebc`; scored run recorded a clean starting tree. Current product changes remain uncommitted. Iteration number 11 is inferred from the branch and preceding harness history, not an explicit session field.
- Fixed source of acceptance: [Task Set A requirements](task-set-a-requirements.md). The session prompt lists 12 numbered requirements; the fixed file separately defines 11 functional requirements and 12 acceptance criteria. These denominators are not interchangeable.
- Original working record: `/private/tmp/axc-ts-a-record.md`; original gate `/private/tmp/axc-a-verification-final.log`; direct tests `/private/tmp/axc-a-test-{domain,data-sources-mongoose-models,persistence,application-services,rest}.log`; direct architecture `/private/tmp/axc-a-arch.log`; host `/private/tmp/axc-a-host.log`.
- Evaluation gate `/private/tmp/axc-evaluation-11-gate-current-elevated.log`; initial sandbox failure `/private/tmp/axc-evaluation-11-gate-current.log`; usage reconciliation `/private/tmp/axc-eval-11-session-usage.log`; evaluation working record `/private/tmp/axc-evaluation-11-record.md`. Temporary logs are local evidence, not durable repository artifacts.

## Acceptance evaluation

| Criterion | Result | Distinct evidence |
| --- | --- | --- |
| A-AC1: defaults | Pass | Running host returns IDs 001–010, page 1, size 10, total 12, pages 2; REST test asserts all first-course DTO fields. |
| A-AC2: keyword across title/summary/tags | Pass | `q=SECURITY` yields exactly 001,002,004,005. Course 002 matches only summary, 004 only tag; 001/005 match title. Case differs from stored text. |
| A-AC3: modality | Pass | Independent `modality=online` gives exactly 001,002,003,005,010, excluding hybrid and in-person courses. |
| A-AC4: status | Pass | Independent `status=active` gives exactly 001,002,003,004,006,011,012, excluding draft and retired. |
| A-AC5: tag | Pass | Independent `tag=AI` gives exactly 001,004,007, demonstrating case-insensitive exact-tag filtering. |
| A-AC6: pagination | Pass | Host page 2/size 5 gives exactly 006–010 with total 12/pages 3. Repository asserts pagination slices for all three sort fields; REST proves default page 1 and boundary size 50. These cover the required page/size behavior. |
| A-AC7: createdAt sort | Pass | Host size 5 yields 012,011,010,009,008; repository asserts full reverse-ID sequence. Title/updatedAt full sequences also asserted separately. |
| A-AC8: invalid values | Pass | Five host error inputs cover modality, status, page, pageSize, sort with status 400 and INVALID_QUERY_PARAMETER. Seventeen REST invalid cases additionally cover malformed/unsafe numbers, repeats, unknown keys, and empty sort. |
| A-AC9: no results | Pass | Host unmatched query and REST boundary query return 200, empty items, totalItems 0, totalPages 0. Repository separately verifies beyond-last-page totals. |
| A-AC10: existing tests | Pass | Original full gate succeeds with preexisting health and Cellix suites. Current replay preserves that result; cached results are not described as fresh execution. |
| A-AC11: required new coverage and two combinations | Pass | Host and repository separately execute q=security + modality=online + status=active → 001,002, and tag=cloud + status=active → 002,011. For the first, 003 fails only q, 004 only modality, 005 only status. For the second, 003 is active without cloud and 009 is cloud without active. Exact IDs discriminate each predicate. |
| A-AC12: documentation | Pass | `apps/docs/docs/api/courses.md` documents route, all query fields/defaults/limits, AND semantics, full success response, empty/out-of-range pages, status 400/error response, and fixture limitations; sidebar and rendered-documentation checks pass. |

## Validation and cache semantics

Node `24.21.0` and pnpm `11.11.0` match repository declarations. No install or product-source modification was needed during evaluation.

The scored run executed each changed feature package directly after its last relevant change:

| Direct command target (`pnpm --filter <target> test`) | Reported passing checks | Runtime cases | Failed |
| --- | ---: | ---: | ---: |
| @axc/domain | 28 | 22 | 0 |
| @axc/data-sources-mongoose-models | 11 | 9 | 0 |
| @axc/persistence | 11 | 8 | 0 |
| @axc/application-services | 16 | 12 (includes 2 existing health cases) | 0 |
| @axc/rest | 24 | 20 | 0 |
| **Total** | **90** | **71** | **0** |

Reported counts include 19 typecheck declarations; they are not 90 runtime cases. Direct `pnpm --filter @axc-verification/archunit-tests test:arch` passed 30 tests across seven files. Course scan is nonvacuous. Direct acceptance passed 16 catalog scenarios and one health scenario through the actual Azure Functions host, rather than Hono-only requests.

Required gate, executed after the final implementation change and repeated during evaluation:

```sh
node scripts/check-script-policy.mjs && pnpm exec biome check . && pnpm run typecheck && pnpm run build && pnpm run docs:check && pnpm run knip && pnpm run e18e && pnpm run test:arch && pnpm run test
```

Original final gate exited 0: typecheck 25/25 cached; build 19/19 cached; architecture 18/18 pipeline tasks cached; final tests 32 successful tasks, 29 cached. Docs validation ran fresh with three checks and rendered-page validation; its prerequisites were cached. Fresh direct tests and preceding build evidence support the unchanged source independently of this replay. Script policy, Biome, Knip and e18e passed; no required stage was left unexecuted in the successful command.

Evaluation's initial sandbox gate exited 1 in acceptance: all 17 scenarios broke during API-host startup (31 other tasks successful/cached). The unchanged command retried with local-process permission exited 0, including 16 catalog + 1 health scenarios freshly executed; test pipeline 32/32 successful, 31 cached. This retry is evaluation evidence and is excluded from the scored session's time and tokens. Cached package and architecture logs in this replay are reused evidence, not fresh tests. No unresolved product failure remains.

Knip baseline and final logs both contain configuration hints; no actionable patch-introduced findings remain. The original run resolved Vitest tsconfig, compiler, Biome, dependency declaration, and unused-export findings before its final gate. No check or architecture guardrail was weakened. User-owned security scans are outside the evaluation.

## Cellix alignment review

Reference comparison used authoritative local `/Volumes/files/src/cellixjs`: community aggregate/value objects and exports; application host, community context, service entity composition, and end-user/query-by-name; persistence data-source/context/entity composition and community read repository/data source; community typed model and model-context builder. Actual implementation and parent exports were inspected, supplementing the original run's reference map and completed review.

| Responsibility | Implemented destination and review result |
| --- | --- |
| Concept classification | Course owns independent identity and lifecycle: aggregate, not derived projection. Modality and status are value objects; tags have no independent lifecycle. No child entities required. |
| Domain | `domain/src/domain/contexts/catalog/course/`: seedwork AggregateRoot, CourseProps/EntityReference, static getNewInstance, separate reconstruction constructor, exported modality/status VOs, aggregate and VO tests. Factory rejects invalid enum runtime input, empty required text/tags, invalid dates and reverse chronology. Both VO valid sets and invalid runtime values are tested. |
| Application | `application-services/src/contexts/catalog/course/search.ts` owns public query/page/DTO/error contracts and curried operation; entity/context interfaces compose it through CourseApi alias. Direct invalid-query tests assert stable code/details and no repository access. Root host receives DataSourcesFactory through ApiContext. |
| Persistence | `persistence/src/datasources/readonly/catalog/course/` owns fixtures, repository contract, AND search, sort/pagination; entity, context and readonly levels compose correctly. Fixtures are validated through the actual registered model and reconstructed as aggregates. |
| Models | Separate `data-sources-mongoose-models` package has typed schema, name/factory/type exports, context registration, runtime fixture consumption, constraint and round-trip tests. No database connection. |
| Transport and API | `rest/src/features/courses.ts` owns parsing, duplicate checks and HTTP error mapping; imports public application contracts. API injects fixture factory and registers the feature route. No course behavior or fixtures in the composition root. |
| Dependency direction | Domain depends on seedwork; models on mongoose; persistence on domain/models; application injects persistence contracts; production REST depends on application. Test-only REST→persistence edge is explicit. Manifest and lockfile edges agree. |
| Behavioral evidence | Exact independent filter results, discriminating combinations, direct application failure validation, focused domain/model tests, full response assertions and host acceptance as detailed above. No mutation workflow requiring save/commit/rollback/concurrency evidence exists. |
| Documentation | Only affected GET operation documented, including input, success/status, error and storage scope; rendered checks passed. |

Justified deviations and deferrals:

1. Fixture-backed storage replaces MongoDB operations. Direct aggregate reconstruction is sufficient for immutable records with no save path; a command-side props adapter/converter, repository and UOW are deferred until commands exist. Future writes require that additional slice, not a claim that Course has no lifecycle.
2. String IDs and ISO strings follow the fixed API contract. The standalone Mongoose model does not extend ObjectId/Base document inheritance or introduce discriminator machinery; there is no shared storage hierarchy. Factory registration is idempotent and tested. Converting to durable MongoDB would require storage adapters and migration decisions.
3. Passport/visa, creation events, child entities and mutation history are omitted because this task defines no authorization or mutation behavior. They must be revisited with future commands.

These substitutions preserve the applicable read-side responsibilities. No unexplained structural defect was found. Targeted mutation testing was not performed; exact-ID counterexamples and focused validation are proportionate to this read-only task. Alignment completion decision: applicable feature obligations met; production persistence remains out of scope.

## Usage reconciliation and limitations

The supplied figures match the raw export's last cumulative event and the sum of all 59 token_usage_record entries. `node scripts/session-usage.mjs <session-path>` exited 0 and independently reconciled all six fields. The workflow's suggested `--timeline` option is unsupported by the current script (exit 2); it was rerun without the option, and the five-minute diagnostic buckets below were derived directly from per-call records. No harness script was edited.

| Counter | Value | Inclusion |
| --- | ---: | --- |
| Input | 5,104,121 | Includes cached input |
| Cached input | 4,999,552 | Subset of input, 97.95% |
| Uncached input | 104,569 | Input minus cached input; not a separate total-token addition |
| Cache-write input | 0 | Not additional input here |
| Output | 23,863 | Includes reasoning output |
| Reasoning output | 4,609 | Subset of output |
| Total | 5,127,984 | Input + output |

| UTC five-minute bucket start | Input | Cached input | Output | Total |
| --- | ---: | ---: | ---: | ---: |
| 2026-11-09 02:00 | 813,662 | 751,488 | 7,401 | 821,063 |
| 2026-11-09 02:05 | 2,193,273 | 2,169,088 | 9,996 | 2,203,269 |
| 2026-11-09 02:10 | 2,097,186 | 2,078,976 | 6,466 | 2,103,652 |

These buckets are not task phases or causal attribution. The run's working record lacked cumulative phase checkpoints; phase deltas and retry-specific token costs remain unknown. Average per-call input was 86,511 tokens; first 23,809 and last 120,039. The export contains 58 top-level exec tool calls; nested tool calls are not equivalent to that count. No subagent calls appear. Four top-level calls requested escalation, including registry installation and local host/gate execution; no substantive user redirect followed the initial prompt.
