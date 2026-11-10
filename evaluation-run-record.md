### Evaluation Run Record
Each participant should complete one Evaluation Run Record per harness/model run.

| Field | Value |
| --- | --- |
| Team | xAI |
| Developer / Operator | Mohit Gupta |
| Reviewer | (leave blank for now) |
| Harness | Grok Build + mog-xai-6 harness 2c8cf5a (2c8cf5a6176afd8fb6842eab5e6850840f81cbbf) |
| Model | grok-4.7-build, reasoning effort medium |
| License / Plan | |
| Codebase | intealth-mda/axc |
| Task Set | A (TS-A-CATALOG-SEARCH); prompt sha1 5914b1cc2c83d4d287ee465c69fcca9bd65e868c, byte-identical to prior a-out-21 prompt file |
| Run Type | Harness Engineering Iteration (mog-xai-6, Cellix-compliance-first) |
| Harness Engineering Used | Lean A/B house-shape guidance in the repo map (UoW only when a command writes state; visa/passport/domain-permissions not required unless the task authorizes writes; REST routes in packages/axc/rest/src/<feature>.routes.ts). Post-run `pnpm run cellix:compliance` report for measurable A/B comparison, not wired into Stop. Stop hook does install, auto-fix, husky verify, and auto-commit (block cap 6). Snyk runs on every verify, including unchanged deps. Launched with `--trust --no-memory --reasoning-effort medium --disallowed-tools "web_search,web_fetch,Agent,image_gen,image_edit,image_to_video,reference_to_video"`. Fresh worktree `/Volumes/files/src/axc-mog-xai-6-a-out` carved from harness tip 2c8cf5a; Grok was not run in the harness worktree. |
| Config / Diff Notes | Effort: medium (`reasoning_effort` medium; session summary current_model_id grok-4.7, primary usage grok-4.7-build). Contamination: clean (`--no-memory`; all tool paths inside the a-out worktree; no cellixjs clone, dist/, or node_modules reads; the agent did not edit this record). Tools used: read_file 89, write 24, search_replace 29, grep 5 (no shell). Write-guard: 53 pre_tool_use, 0 denies. Read-guard denies: 16 events, 13 unique (3 grep; Cellix domain-seedwork/mongoose-seedwork files and package.json; axc-verification archunit-tests paths; biome.json; pnpm-workspace.yaml; package.json). **Gate integrity: OK, 3 blocks, then a green Stop-hook auto-commit, then allow on a clean tree at exit.** Stop fired 5 times. Stop #1 (21:32:42 ET, 124 s): check failed, application-services-conventions "entity indexes must export a factory named after the entity folder". Stop #2 (21:34:48, 100 s): the same conventions check failed again; the agent reported that the `Course` factory export was added, then removed as unused before the next verify (knip/auto-fix). Stop #3 (21:36:57, 87 s): husky verify failed in `@axc/domain#test` because the new `test` script also loaded `src/archunit-tests/domain-conventions.test.ts` without the arch Vitest config (`expect` is not defined globally). Fix: `test` scoped to `src/domain`; `test:arch` still ran separately and was green on the successful verify (this is not a skip of the architecture suite). Stop #4 (21:37:26–21:39:26, 119 s): install, auto-fix, husky verify green (`verify ok · acceptance 10/10 · 66c32f6`), auto-committed 66c32f6. Auto-fix logged in the commit body: build (knip could not load its config), knip --fix exports/types, biome check --write. The feature commit also includes `pnpm-lock.yaml`. Stop #5 (21:43:14, 324 ms, at exit) allowed on the clean tree. Stop-gate state: blocks 2 recorded after the later allows (3 block events were observed in the session hooks). Cellix compliance on 66c32f6: errors=0 (shape, REST entry, import boundary, application-service entry, seed arrays all 0); entities=catalog/course; layers=domain,persistence,application-services,rest; route_modules=1; optional uow=0, visa=1, passport=1, domain_permissions=1. Baseline `mog-xai-5-a-out-trashed` (`ca3df15`) scored errors=1 (flat `packages/axc/domain/src/domain/catalog/course.ts`). Visa/passport/domain-permissions files are optional and were not required for this read-only task. Flow: 23 model calls of orientation, exploration, and writes before the first Stop (21:13–21:30 ET), including a mid-write query-parser rewrite; then 3+5+5 model calls recovering from the three blocks; then the green Stop and exit. This Grok session did not record per-call `inference_done` usage, so token totals are not split call-by-call. Meter source: Grok Build `/usage` (matches session usage.json exactly): input 3,024,351 (2,786,688 cached), output 80,636 (55,599 reasoning), total 3,104,987, 36 model calls, API time 18m10s, cost $0.7998. Session 01a1c33b-2fa2-78b2-bfbc-3b6733bc84ae, process 21:13:18–21:43:14 America/New_York. No cherry-picks; the feature commit is the only SCORE commit on top of 2c8cf5a (this record is a follow-up commit). |
| Branch / Commit | mog-xai-6-a-out / feature 66c32f6ae873df815055daa8c51cf046529b1aae (Stop-hook auto-commit after 3 blocks); start 2c8cf5a6176afd8fb6842eab5e6850840f81cbbf |
| Requirements Completed / Attempted | 11/11 (A1–A11); A10 tests and A11 docs present; existing tests pass in the husky verify on 66c32f6 |
| Acceptance Criteria Passed / Total | 12/12: A-AC1–A-AC9 each have a tagged scenario (id in the scenario title) that passed at runtime in the husky verify for 66c32f6 (2026-11-09 21:37–21:39 America/New_York); A-AC10–A-AC12 covered by `# ac-meta` in courses.feature (A-AC10 by green verify incl. healthcheck, A-AC11 by 16 application-service unit tests + 2 domain aggregate tests + 9 course scenarios, A-AC12 by apps/docs/docs/courses.md); check-ac-coverage exit 0 (re-checked read-only) |
| Tests Passed / Failed | Husky verify on 66c32f6: acceptance 10/10 (course catalog search 9/9, healthcheck 1/1), 0 failed; unit and arch suites green in that verify (`test:arch` included domain, persistence, and application-services convention files). Attempt 1 and 2 red on the application-services entity-factory export check; attempt 3 red on `@axc/domain#test` loading the arch conventions file under the unit-test script. |
| Static Analysis / Security Findings | Husky verify on 66c32f6 (exit 0): script-policy PASS, ac-coverage PASS, node --test PASS, biome PASS, typecheck PASS, build PASS, knip PASS, e18e PASS, arch PASS, unit+acceptance PASS, audit PASS (`pnpm audit --audit-level=high`: 6 vulnerabilities, 1 low and 5 moderate, none at high or critical), snyk RAN (23 projects, no vulnerable paths found; after the green result the CLI also printed the monthly limit of 200 private tests for org mgupta83). Logs: /var/folders/8r/6l2t39bx3bz10w0kgs3tn7cm0000gn/T/axc-verify-axc-mog-xai-6-a-out.log, /var/folders/8r/6l2t39bx3bz10w0kgs3tn7cm0000gn/T/axc-stop-axc-mog-xai-6-a-out.log (overwritten by the green attempt). |
| Input Tokens | 3024351 |
| Cached Tokens | 2786688 (inside Input) |
| Output Tokens | 80636 (reasoning 55599) |
| Total Tokens or Credits Used | 3104987 |
| Estimated Cost | $0.7998 |
| Elapsed Time | API 18m10s (Grok Build `/usage`; apiDurationMs 1,090,093); session process 21:13:18–21:43:14 America/New_York (29m56s): model 18m10s, Stop #1–#3 blocked 124s + 100s + 87s, Stop #4 install+auto-fix+verify+commit 119s, idle after commit until `/usage` and exit, then Stop #5 324 ms |
| Number of Human Interventions / Redirects | 0 |
| Reviewer Notes | (leave blank for now) |
| Final Rubric Score | (leave blank for now) |
| Recommendation | Pass on function and Cellix compliance, not a token candidate. Official `/usage` is 3,104,987 tokens / 36 calls / $0.7998, versus a-out-14 at 350,587 / 10 / $0.1482 and a-out-21 at 483,574 / 8 / $0.2219. Cellix score improved from 1 error (flat domain file on `mog-xai-5-a-out-trashed`) to 0 errors. Main token sinks: (1) 36 model calls, so a large context was re-sent many times (mean about 84k input tokens per call; 92.1% of input was cached); (2) 23 calls of exploration and writing before the first Stop, including repeated reads of closed trees that the read-budget already denied; (3) three Stop repair loops (13 further calls), two of them on the same missing `Course` factory export, and one on a new domain `test` script picking up architecture tests; (4) optional visa/passport/domain-permissions files that this read-only task did not require. Further harness changes should go on a new mog-xai-7 iteration, not onto mog-xai-6. |

### Grok Build `/usage` paste checklist (SCORE meter)

Mohit-confirmed path: fresh Grok Build session → unmodified TS-A → run **`/usage`** once before close → fill the five fields above. Do **not** invent numbers. Do **not** use unofficial session logs as a substitute for `/usage`.

| Paste from `/usage` | Into record field |
| --- | --- |
| Input | Input Tokens |
| Cached (or cache-read) | Cached Tokens — if absent: `n/a` + reason only for that field |
| Output | Output Tokens |
| Total | Total Tokens or Credits Used |
| Cost (or credits USD) | Estimated Cost |

Also set Config / Diff Notes: meter source `Grok Build /usage` + session timestamp (America/New_York).
