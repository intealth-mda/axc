### Evaluation Run Record
Each participant should complete one Evaluation Run Record per harness/model run.

| Field | Value |
| --- | --- |
| Team | Cursor |
| Developer / Operator | Ethan Nguyen |
| Reviewer | (leave blank for now) |
| Harness | Cursor |
| Model | Grok 4.7 high-fast |
| License / Plan | Cursor Team Plan |
| Codebase | ECFMG/axc |
| Task Set | B |
| Run Type | Harness Engineering Iteration 7 |
| Harness Engineering Used | Frozen Iteration 7 tip `en-cur-7` @ `c4fc5ed` (Iteration 6 efficiency controls plus Phase 1b–1d): advisory terminal stop, no budget delete, post-verify knip/audit blocked outside wrapped verify, one-pass discovery/validation, closed installed/vendored trees. Typecheck-before-verify prose from early I7 was reverted after it inflated Task A tokens. |
| Config / Diff Notes | Usage is the Grok 4.7 high-fast dashboard delta for the scored Task B chat. Cache read 3,175,296; cache write 0; input 164,129; output 101,262; total 3,440,687. Transcript `93f075e1-ff3b-40fd-b554-2f4ffdb1e1e1`: 32 assistant turns, 104 tool calls, first write on turn 9, 11 shells, 2 wrapped verifies. Budget ended `{verifies:2, lastVerifyStatus:1, terminal:false}` (used the allowed verify retry; pre-existing high/critical audit advisories on the harness tip). Agent also edited harness `scripts/agent-check.mjs` and `scripts/check-budget.mjs`; logic restored then Biome format-only normalize kept so pre-commit passes. Independent `@axc/application-services` tests: 32 passed. Operator Postman: Task A collection 14/14; Task B create/get/list/approve plus missing-course and invalid-email negatives green. Operator extended suite (`ai-brain/calculations/quality-suite`): 41 requests / 50 assertions / 0 failures after unique `runId` emails. After the scored run, `pnpm-workspace.yaml` overrides were updated (storybook 10.6.3, follow-redirects 1.16.2, vite 8.3.3, launch-editor 2.14.2, happy-dom 21.0.4, zod 4.6.6, joi 17.13.9, body-parser 2.4.0, `@graphql-tools/utils` 12.0.2) so `pnpm audit --audit-level=high` passes for publish; that pin is separate from the measured run. |
| Branch / Commit | `en-cur-7-b-out` / feature+pin commits on this push; harness `en-cur-7` @ `c4fc5ed` |
| Requirements Completed / Attempted | 17 / 17 (B1–B17). Course search preserved; enrollment create/get/list/status with validation, duplicates, transitions, history, package tests, acceptance scenarios, and API docs. |
| Acceptance Criteria Passed / Total | 15 / 15 (B-AC1–B-AC15) from implementation, application-service tests, typecheck, Postman, and extended operator suite. HTTP acceptance feature covers one create success, one combined course search, and one invalid pageSize, plus existing healthcheck. |
| Tests Passed / Failed | Application-services: 32 passed, 0 failed (includes course search regression and enrollment matrix). Acceptance: 3 catalog scenarios + healthcheck. Scored-chat last wrapped verify reported non-zero status after the retry; independent package build/test and operator HTTP checks passed afterward. |
| Static Analysis / Security Findings | Domain/application-services build and typecheck passed independently. Architecture write boundary followed (`apps/api` composes in-memory stores; application services/REST do not import persistence beyond allowed wiring). No new third-party dependency beyond workspace `@axc/domain` / `@axc/persistence` links during the scored run. Post-run override pin clears `pnpm audit --audit-level=high` (0 high/critical remaining; lows/moderates remain). Snyk CLI not on PATH locally (skipped non-blocking). |
| Input Tokens | 164,129 |
| Cached Tokens | 3,175,296 cache read; 0 cache write |
| Output Tokens | 101,262 |
| Total Tokens or Credits Used | 3,440,687 |
| Estimated Cost | About $5.05 at Cursor's published Grok 4.7 Fast short-context list price ($4 input, $1 cache read, $12 output per 1M tokens). The dashboard did not show a cost. Long-context Fast rates are 1.5 times that price, about $7.58. At the other harness's published rates ($2 uncached input, $0.10 cached input, $10 output per 1M), this token mix is about $1.67. That figure is a comparison, not the billed cost. The Team plan may cover this inside included usage. |
| Elapsed Time | 16m 32s |
| Number of Human Interventions / Redirects | 0 during the scored chat |
| Reviewer Notes | (leave blank for now) |
| Final Rubric Score | (leave blank for now) |
| Recommendation | Continue |
