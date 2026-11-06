### Evaluation Run Record 
Each participant should complete one Evaluation Run Record per harness/model run. 

| Field | Value |
| --- | --- |
| Team | OpenAI (Modern Apps) |
| Developer / Operator | Dhaval Heruwala |
| Reviewer | Dhaval Heruwala (self-review) |
| Harness | OpenAI Codex CLI 0.162.1 (interactive) |
| Model | GPT-6.1-Sol, medium reasoning |
| License / Plan | ChatGPT Business (Business Premium seat) |
| Codebase | ECFMG/axc (agentCourses) |
| Task Set | Task Set A: Course Catalog Search Endpoint (TS-A-CATALOG-SEARCH) |
| Run Type | Harness Engineering Iteration 7 (final configuration) |
| Harness Engineering Used | djh-oai-6 plus four lines aimed at the wasted requests in its run. AGENTS.md now tells the agent to start builds and tests with Codex's longest wait (30 seconds) and to poll with a long wait, because every poll is a full model request. The cellix-slice skill names the three check failures that each cost djh-oai-6 a round of fixes: constructor parameter properties under erasableSyntaxOnly, async stubs without await, and bare `<placeholders>` in the MDX docs. |
| Config / Diff Notes | Started from djh-oai-7 (`e20a882`). Same steps as before: fresh clone, hooks already trusted, task-set-a-prompt.md pasted as is. The session got only cellix-slice and Codex's four built-in skills. The agent started every long command with the 30-second wait and never had to poll. It changed 43 files (+836/-12 without the lockfile), all inside the write boundary, and the lockfile only gained workspace and catalog links. The CI gate passed on the first attempt. I committed the output with --no-verify because the Stop hook had just run the same checks. I'm freezing this configuration for Task B. |
| Branch / Commit | djh-oai-7-a-out @ `7d43c72` |
| Requirements Completed / Attempted | 11 / 11 |
| Acceptance Criteria Passed / Total | 12 / 12 |
| Tests Passed / Failed | 619 passed / 0 failed in the unit suites (77 new: 29 in rest, 25 in persistence, 15 in domain, 8 in application-services). 26/26 Serenity scenarios (25 new, each named with its criterion id), 63/63 architecture tests. pnpm install --frozen-lockfile passes. My HTTP probe against the running API passed 20/20 checks. GitHub Actions on PR #43: verify passed on both runs. Sourcery approved it with no comments. |
| Static Analysis / Security Findings | 0 critical, 0 high, 0 medium new findings. pnpm run verify passes: Biome (331 files), typecheck, build, Knip, e18e, arch tests, all tests, pnpm audit (same as the start commit), Snyk (23 projects, clean). No secrets, no boundary violations, no tooling config changes. |
| Input Tokens | 492,393 |
| Cached Tokens | 469,888 |
| Output Tokens | 13,119 |
| Total Tokens or Credits Used | 505,512 tokens; 0 credits (covered by the seat; the weekly limit read 2% used before and after the run) |
| Estimated Cost | $0.22 at API list price ($2 input / $0.10 cached / $10 output per 1M) |
| Elapsed Time | 6 min 33 sec (including one passing run of the CI gate) |
| Number of Human Interventions / Redirects | 0 |
| Reviewer Notes | Best run of the round. Everything I tested works, and the agent needed no help. It kept the design djh-oai-6 got right: CourseProps and CourseEntityReference in the domain, a read repository that returns entity references, one typed CourseValidationError checked in the domain and mapped to the 400 in REST, `as const` value lists, and this time domain unit tests too. Two small things are left: REST passes unknown or repeated parameters into the domain query as invalidFields so they land in the same error list, which puts an HTTP concern in a domain type, and the repository still casts the sort field. Tokens fell 40% from djh-oai-6 to 506k, about the same as djh-oai-5 and 44% below the baseline. The cost was the lowest of any run at $0.22, partly because no request missed the prompt cache, and it was also the fastest run. |
| Final Rubric Score | 98 / 100 |
| Recommendation | Candidate for Pilot. Freeze djh-oai-7 and run Task B on it once. |
