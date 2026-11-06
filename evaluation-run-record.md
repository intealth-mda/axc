### Evaluation Run Record 
Each participant should complete one Evaluation Run Record per harness/model run. 

| Field | Value |
| --- | --- |
| Team | OpenAI (Modern Apps) |
| Developer / Operator | Dhaval Heruwala |
| Reviewer | Dhaval Heruwala (self-review) |
| Harness | OpenAI Codex CLI 0.162.1 (interactive); the session ran on Codex's self-updating app-server 0.166.0 |
| Model | GPT-6.1-Sol, medium reasoning |
| License / Plan | ChatGPT Business (Business Premium seat) |
| Codebase | ECFMG/axc (agentCourses) |
| Task Set | Task Set A: Course Catalog Search Endpoint (TS-A-CATALOG-SEARCH) |
| Run Type | Harness Engineering Iteration 6 |
| Harness Engineering Used | djh-oai-5 plus one change set aimed at the gaps in its Task A output. AGENTS.md got a short "smallest complete change" section adapted from Ponytail (MIT, credited in .codex/THIRD_PARTY_NOTICES.md). The cellix-slice skill now shows the CellixJS entity shape for read-only entities too, a typed validation error checked in one place, and allowed values as `as const` lists, and two new architecture tests enforce the entity shape and entity references from read repositories. The repo's Codex config also turns plugins off, because the plugins Codex installs for our ChatGPT workspace ignore `enabled = false` in the home config. |
| Config / Diff Notes | Started from djh-oai-6 (`aa60b02`). Same steps as before: fresh clone, hooks already trusted, task-set-a-prompt.md pasted as is. The session got only cellix-slice and Codex's four built-in skills, so the 10 workspace plugin skills from the djh-oai-5 run were gone, and the first request still reused the shared 12k-token prompt cache. The agent changed 39 files (+798/-11 without the lockfile), all inside the write boundary, and the lockfile only gained workspace and catalog links. The CI gate passed on the first attempt. I committed the output with --no-verify because the Stop hook had just run the same checks. |
| Branch / Commit | djh-oai-6-a-out @ `98df73b` |
| Requirements Completed / Attempted | 11 / 11 |
| Acceptance Criteria Passed / Total | 12 / 12 |
| Tests Passed / Failed | 598 passed / 0 failed in the unit suites (56 new: 31 in rest, 19 in persistence, 6 in application-services). 23/23 Serenity scenarios (22 new, each named with its criterion id), 63/63 architecture tests including the two new ones. pnpm install --frozen-lockfile passes. My HTTP probe against the running API passed 20/20 checks. GitHub Actions on PR #42: verify passed on both runs. Sourcery approved it with no comments. |
| Static Analysis / Security Findings | 0 critical, 0 high, 0 medium new findings. pnpm run verify passes: Biome (328 files), typecheck, build, Knip, e18e, arch tests, all tests, pnpm audit (same as the start commit), Snyk (23 projects, clean). No secrets, no boundary violations, no tooling config changes. |
| Input Tokens | 831,198 |
| Cached Tokens | 772,736 |
| Output Tokens | 13,974 |
| Total Tokens or Credits Used | 845,172 tokens; 0 credits (covered by the seat; the weekly limit read 2% used before and after the run) |
| Estimated Cost | $0.33 at API list price ($2 input / $0.10 cached / $10 output per 1M) |
| Elapsed Time | 7 min 30 sec (including one passing run of the CI gate) |
| Number of Human Interventions / Redirects | 0 |
| Reviewer Notes | Everything I tested works, and the agent needed no help. The architecture gaps from djh-oai-5 are gone: CourseProps extends DomainEntityProps with a CourseEntityReference, the read repository returns entity references and keeps its page type in persistence, validation runs once in the domain and throws a typed CourseValidationError that REST maps to the 400, and the allowed values are `as const` lists. One cast is left in the repository's sort. Cost went the wrong way. Output was about the same as djh-oai-5 and the prompt was smaller without the plugin skills, but the run took 22 model requests instead of 14, so tokens rose 71% to 845k and the cost from $0.29 to $0.33. Most of the extra requests came from starting builds with a one-second wait and then polling for the result (10 polls against 2). The rest were fixes after failed checks, such as a constructor parameter property that the TypeScript settings reject and a `<query>` placeholder that broke the docs build. |
| Final Rubric Score | 94 / 100 |
| Recommendation | Continue. The architecture fixes worked, but with 71% more tokens djh-oai-5 stays the Task B candidate unless the next iteration removes the polling. |
