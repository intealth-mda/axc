### Evaluation Run Record 
Each participant should complete one Evaluation Run Record per harness/model run. 

| Field | Value |
| --- | --- |
| Team | Anthropic |
| Developer / Operator | Seven Thomas |
| Reviewer | (leave blank for now) |
| Harness | Claude Code (VS Code extension) with the repo's agent harness: a managerial agent that only plans and delegates; `developer`, `unit-tester`, verifier and committer sub-agents; PreToolUse guard hooks per role; a Stop-hook quality gate; the compact gate script (`.claude/scripts/gate.mjs`); the `axc-feature` skill |
| Model | Claude Opus 5.5 (`claude-opus-5-5`), for the manager and every sub-agent |
| License / Plan | (operator to fill) |
| Codebase | ECFMG/axc |
| Task Set | A (TS-A-CATALOG-SEARCH, Course Catalog Search Endpoint) |
| Run Type | Harness Engineering Iteration (harness v3, base 88398ec; operator to confirm N) |
| Harness Engineering Used | AGENTS.md role instruction sets (01 to 04); role guard hooks (manager, developer, unit tester, committer); TDD flow (skeleton, red, green, verify); a separate verifier sub-agent; a test-challenge process; the Stop gate; the compact gate; the `axc-feature` skill; plan and status kept in `.agents-work/` |
| Config / Diff Notes | No harness or config changes in this run. The product diff is 14 files:<br>• `packages/axc/application-services/src/{courses.ts, course-fixtures.ts, index.ts}` and tests `courses.test.ts`, `index.test.ts`<br>• `packages/axc/rest/src/index.ts` and `index.test.ts`<br>• `apps/api/src/index.ts`<br>• `apps/docs/docs/courses.md`, `apps/docs/sidebars.ts`<br>• `packages/axc-verification/acceptance-api/src/{features/courses.feature, step-definitions/courses.steps.ts}`<br>No new dependencies, no new directories, no `packages/cellix/**` changes. |
| Branch / Commit | `st-ant-3-a-out`. The changes are uncommitted in the working tree on top of 88398ec, because no commit was requested. |
| Requirements Completed / Attempted | 12 / 12 prompt requirements (A1 to A11: 11 / 11) |
| Acceptance Criteria Passed / Total | 12 / 12 (A-AC1 to A-AC12, confirmed by an independent verifier sub-agent) |
| Tests Passed / Failed | 725 unit and architecture tests passed, 0 failed (application-services 121, rest 24). Acceptance: 4 / 4 scenarios (3 new course scenarios and 1 healthcheck). 72 new unit tests. Coverage on new code: `courses.ts`, `course-fixtures.ts` and `index.ts` 100% lines and branches; the new REST route fully covered. |
| Static Analysis / Security Findings | `gate.mjs --full` passes every step: script policy, biome, typecheck, build, knip, e18e, test:arch, test, pnpm audit, snyk. 0 open findings. The verifier's review found 2 issues, both fixed and re-verified:<br>• A minor bug: a huge `page` returned 200 with `page: null`. Fixed TDD-style.<br>• A docs example that did not match the fixtures.<br>A test-set contradiction about fixture course-005 was raised by the developer as a test challenge, upheld, and resolved. No regex built from user input, so no injection or ReDoS. |
| Input Tokens | 308 uncached, plus 385,605 cache-write (manager 89,172; sub-agents 296,741) |
| Cached Tokens | 5,866,733 cache-read (manager 2,608,263; sub-agents 3,258,470) |
| Output Tokens | 91,030 (manager 17,717; sub-agents 73,313) |
| Total Tokens or Credits Used | 6,343,676 tokens: 139 API responses over 10 sub-agent runs plus the manager. Summed from the session transcripts' `usage` fields. |
| Estimated Cost | About $6.08 at Opus 5.5 API rates ($4 per million input, $20 per million output, $8 per million 1-hour cache write, $0.20 per million cache read). About $4.93 if cache writes were billed at the 5-minute rate. Covers the run up to the final record-keeping turn. |
| Elapsed Time | About 18 minutes wall clock (15:03:57 to about 15:22 EST, 2026-11-05). About 15.1 minutes of sub-agent run time in total. |
| Number of Human Interventions / Redirects | 0. The automated Stop gate blocked the manager 5 times during the expected TDD red and amendment phases; no human input was involved. |
| Reviewer Notes | (leave blank for now) |
| Final Rubric Score | (leave blank for now) |
| Recommendation | Candidate for Pilot |
