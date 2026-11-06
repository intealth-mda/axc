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
| Run Type | Harness Engineering Iteration 5 (round 2, team harness with Henry Casper) |
| Harness Engineering Used | djh-oai-4 plus our round 2 changes. Henry added the architecture tests from his hac-oai-16 harness that enforce the Cellix layers and conventions, cleared the Snyk and audit findings, and pinned the CI runner. I kept in-memory storage, rewrote the cellix-slice skill around the shapes those tests expect, made the application-service feature files executable with vitest-cucumber, had the agent report its own token use and cost, and hid main's turborepo and portless skills from the agent without deleting them. On the day of the run I also moved Cucumber to 13.0.0 and pinned `open` to 11.0.4 for two new Snyk advisories. |
| Config / Diff Notes | Started from djh-oai-5 (`9149012`). Same steps as round 1: fresh clone, hooks approved before the prompt, task-set-a-prompt.md pasted as is. The github and egm plugins and six Microsoft Foundry skills were off in my home config. Five plugins that Codex installs for our ChatGPT workspace were still on, and I only found them afterwards in the session log: they added 10 skill descriptions, about 1.8k tokens, to every request. The agent changed 43 files (+855/-14 without the lockfile), all inside the write boundary, and the lockfile only gained workspace and catalog links. The CI gate passed on the first attempt. I committed the output with --no-verify because the Stop hook had just run the same checks. |
| Branch / Commit | djh-oai-5-a-out @ `4829312` |
| Requirements Completed / Attempted | 11 / 11 |
| Acceptance Criteria Passed / Total | 12 / 12 |
| Tests Passed / Failed | 612 passed / 0 failed in the unit suites (70 new: 34 in rest, 28 in persistence, 8 in application-services). 28/28 Serenity scenarios (27 new, each named with its criterion id), 61/61 architecture tests. pnpm install --frozen-lockfile passes. My HTTP probe against the running API passed 20/20 checks. GitHub Actions on PR #38: verify passed on both runs. Sourcery approved it with no comments. |
| Static Analysis / Security Findings | 0 critical, 0 high, 0 medium new findings. pnpm run verify passes: Biome (328 files), typecheck, build, Knip, e18e, arch tests, all tests, pnpm audit (same as the start commit), Snyk (23 projects, clean). No secrets, no boundary violations, no tooling config changes. |
| Input Tokens | 481,328 |
| Cached Tokens | 426,496 |
| Output Tokens | 13,721 |
| Total Tokens or Credits Used | 495,049 tokens; 0 credits (covered by the seat; the weekly limit read 2% used before and after the run) |
| Estimated Cost | $0.29 at API list price ($2 input / $0.10 cached / $10 output per 1M) |
| Elapsed Time | 7 min 06 sec (including one passing run of the CI gate) |
| Number of Human Interventions / Redirects | 0 |
| Reviewer Notes | Everything I tested works, and the agent needed no help. The layout follows Cellix with persistence injected from apps/api, and the docs have the API page, a MADR decision record and a traceability page. The domain model is lighter than CellixJS: Course is a plain interface rather than CourseProps and CourseEntityReference, the read repository returns plain records, the query and page types sit in the entity file, and the application service throws a plain Error after REST has already run the same validation. Tokens are down 45% from the baseline and 29% from djh-oai-4, but the cost stayed at $0.29. Output grew with the extra tests and docs, and two requests missed OpenAI's prompt cache, which accounts for 36.6k of the 54.8k uncached tokens. The workspace plugins' skill descriptions were about 25k of the input. |
| Final Rubric Score | 95 / 100 |
| Recommendation | Candidate for Pilot. Before freezing I'm running djh-oai-6, which fixes the gaps above and turns plugins off in the repo config, and I'll keep whichever does better for Task B. |
