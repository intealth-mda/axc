### Evaluation Run Record 
Each participant should complete one Evaluation Run Record per harness/model run. 

| Field | Value |
| --- | --- |
| Team | OpenAI (Modern Apps) |
| Developer / Operator | Dhaval Heruwala |
| Reviewer | Dhaval Heruwala (self-review) |
| Harness | OpenAI Codex CLI 0.162.1 (interactive); the session ran on Codex's self-updating app-server, 0.166.0 and then 0.167.0 |
| Model | GPT-6.1-Sol, medium reasoning |
| License / Plan | ChatGPT Business (Business Premium seat) |
| Codebase | ECFMG/axc (agentCourses) |
| Task Set | Task Set B: Course Search and Enrollment Request Workflow (TS-B-COURSE-ENROLLMENT-WORKFLOW) |
| Run Type | Final (frozen harness djh-oai-7, single Task B run) |
| Harness Engineering Used | The frozen djh-oai-7 configuration, unchanged since its Task A run: AGENTS.md with the smallest-change and token rules, the cellix-slice skill, architecture tests for the Cellix layers and entity shapes, a hook that runs pnpm install outside the sandbox when a package.json changes, a Stop hook that only lets the agent finish when the CI steps pass, and project config for model, effort and plugins off. Nothing was changed for Task B. |
| Config / Diff Notes | Started from djh-oai-7 (`e20a882`) with no Task A code in it. Fresh clone, hooks already trusted, task-set-b-prompt.md pasted as is. About seven minutes in, Codex's app-server updated itself from 0.166.0 to 0.167.0 and restarted. Codex interrupted the turn and resumed it on its own with a recovery note, the agent's edits were intact, and I didn't touch anything. After the restart Codex also listed ChatGPT app tools in the session, which the agent didn't use. The agent changed 79 files (+2,023/-17 without the lockfile), all inside the write boundary, and the lockfile only gained workspace and catalog links. The CI gate passed on the first attempt. I committed the output with --no-verify because the Stop hook had just run the same checks. |
| Branch / Commit | djh-oai-7-b-out @ `6dc39ab` |
| Requirements Completed / Attempted | 17 / 17 |
| Acceptance Criteria Passed / Total | 15 / 15 |
| Tests Passed / Failed | 625 passed / 0 failed in the unit suites (83 new: 45 in rest, 18 in persistence, 12 in application-services, 8 in domain). 54/54 Serenity scenarios (53 new, each named with its criterion id), 63/63 architecture tests. pnpm install --frozen-lockfile passes. My HTTP probe against the running API passed 34/34 checks, covering every error code, duplicates (also with a different email case), every allowed and refused status change, the reason rule, the audit history and the list filters. GitHub Actions on PR #44: verify passed on both runs. Sourcery: 2 comments (see notes). |
| Static Analysis / Security Findings | 0 critical, 0 high, 0 medium new security findings. pnpm run verify passes: Biome (355 files), typecheck, build, Knip, e18e, arch tests, all tests, pnpm audit (same as the start commit), Snyk (23 projects, clean). No secrets, no boundary violations, no tooling config changes. |
| Input Tokens | 1,719,609 |
| Cached Tokens | 1,676,416 |
| Output Tokens | 39,331 |
| Total Tokens or Credits Used | 1,758,940 tokens; 0 credits (covered by the seat; the weekly limit read 2% used before the run and 3% after) |
| Estimated Cost | $0.65 at API list price ($2 input / $0.10 cached / $10 output per 1M) |
| Elapsed Time | 18 min 33 sec (including the app-server restart and one passing run of the CI gate) |
| Number of Human Interventions / Redirects | 0 |
| Reviewer Notes | Everything I tested works, and the agent needed no help, including through the Codex restart. The design is the full Cellix slice: an EnrollmentRequest aggregate with getNewInstance, its repository and unit of work as domain interfaces with in-memory implementations in persistence, read repositories that return entity references, typed errors carrying the task's codes that REST maps to HTTP, and an executable feature file and test for every application-service operation. The docs have API pages for both resources, a MADR decision record and a traceability page for all 17 requirements and 15 criteria. Sourcery raised two points: the email check accepts a domain with consecutive dots such as `learner@domain..com`, and both acceptance features share one step-definitions file where the repo convention is one per capability. Neither changes the result, and I didn't rerun Task B because the harness is frozen. Tokens nearly doubled against round 1's Task B (0.94M). The harness now requires the full write side and a feature file per operation, so the agent wrote 79 files instead of 49, made 30 model requests instead of 20, and its context grew to 89k tokens. |
| Final Rubric Score | 96 / 100 |
| Recommendation | Candidate for Pilot |
