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
| Task Set | A |
| Run Type | Harness Engineering Iteration 7 |
| Harness Engineering Used | Frozen Iteration 7 tip `en-cur-7` @ `c4fc5ed` (Phase 1d): Iteration 6 efficiency controls plus advisory terminal stop, no budget delete, and post-verify knip/audit blocked outside wrapped verify. Earlier I7 typecheck-before-verify prose was reverted after it inflated Task A tokens. |
| Config / Diff Notes | Usage is the Grok 4.7 high-fast dashboard delta for the winning Phase 1d Task A chat. Cache read 1,480,448; cache write 0; input 98,075; output 52,531; total 1,631,054. Transcript `85242e00-6ccf-4fad-b7fd-8bbbe2de1b9c`: 25 assistant turns, 83 tool calls, first write on turn 8, 9 shells, 2 wrapped verifies. Budget after the run was `{verifies:2, lastVerifyStatus:1, terminal:false}`. The agent briefly Biome-formatted harness scripts then restored them during the scored chat. Publication commit replays that transcript’s Write/StrReplace edits onto clean `c4fc5ed` (no enrollment code), and carries the same post-run `pnpm-workspace.yaml` override pin + Biome format-only script normalize as `en-cur-7-b-out` so `pnpm audit --audit-level=high` passes for publish. Independent `@axc/application-services` tests after recovery: 20 passed. |
| Branch / Commit | `en-cur-7-a-out` @ `56140e7` (feat), `d237731` (record); harness `en-cur-7` @ `c4fc5ed` |
| Requirements Completed / Attempted | 11 / 11 (A1–A11). `GET /api/courses` with keyword/modality/status/tag filters, pagination, sort, invalid-query errors, seeded catalog, package + acceptance tests, and course docs. |
| Acceptance Criteria Passed / Total | 12 / 12 (A-AC1–A-AC12) from implementation, package tests, and course acceptance scenarios (default page, combined filters, invalid pageSize) plus healthcheck. |
| Tests Passed / Failed | Application-services: 20 passed, 0 failed after recovery. Acceptance: 3 course scenarios + healthcheck. Scored-chat last wrapped verify reported non-zero status after the retry (pre-existing high/critical audit advisories on the tip); publish pin clears high/critical for the commit hook. |
| Static Analysis / Security Findings | Domain/application-services build and typecheck passed independently after recovery. Write boundary followed. No enrollment/Task B files on this branch. Post-run override pin (shared with I7B publish) clears `pnpm audit --audit-level=high`. Snyk CLI not on PATH locally (skipped non-blocking). |
| Input Tokens | 98,075 |
| Cached Tokens | 1,480,448 cache read; 0 cache write |
| Output Tokens | 52,531 |
| Total Tokens or Credits Used | 1,631,054 |
| Estimated Cost | About $2.50 at Cursor's published Grok 4.7 Fast short-context list price ($4 input, $1 cache read, $12 output per 1M tokens). The dashboard did not show a cost. Long-context Fast rates are 1.5 times that price, about $3.75. At the other harness's published rates ($2 uncached input, $0.10 cached input, $10 output per 1M), this token mix is about $0.97. That figure is a comparison, not the billed cost. The Team plan may cover this inside included usage. |
| Elapsed Time | 7m 24s |
| Number of Human Interventions / Redirects | 0 during the scored chat |
| Reviewer Notes | (leave blank for now) |
| Final Rubric Score | (leave blank for now) |
| Recommendation | Continue |
