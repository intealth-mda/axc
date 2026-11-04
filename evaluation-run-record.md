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
| Run Type | Harness Engineering Iteration 8 |
| Harness Engineering Used | Frozen Phase 1b tip `en-cur-8` @ `212d5ce`: I7 efficiency controls + bounded agent-check FAIL logs / rg-tail Log guidance only. No nearest-slice persistence nudge. |
| Config / Diff Notes | Dashboard delta for scored Task B. Cache read 3,088,384; cache write 0; input 227,992; output 96,124; total 3,412,500. Transcript `28f2854f-239d-4f2c-95d4-d835fda5fcb1`: 36 turns, 131 tools, first write turn 17, 12 shells, 3 verify attempts (budget ended `{verifies:2, lastVerifyStatus:1}`). Implementation includes shared `catalog-test-support`, persistence memory catalog, enrollment routes. Independent after-run: `@axc/application-services` and `@apps/api` typecheck exit 0; catalog tests 36 passed. vs I7B: −28K tokens, −49s, est. cost +~$0.10 (more expensive input mix). |
| Branch / Commit | `en-cur-8-b-out` / feature commit on this push; harness `en-cur-8` @ `212d5ce` |
| Requirements Completed / Attempted | 17 / 17 (B1–B17) |
| Acceptance Criteria Passed / Total | 15 / 15 (B-AC1–B-AC15) from implementation, package tests, and typecheck |
| Tests Passed / Failed | Application-services catalog tests: 36 passed, 0 failed independently. Acceptance: course-enrollment feature present. Scored chat used verify retry (last status non-zero); tree typechecks afterward. |
| Static Analysis / Security Findings | Typecheck passed for application-services and apps/api. Host composes persistence in `apps/api`. Shared test helper used. Audit pin on harness tip keeps `pnpm audit --audit-level=high` publishable. |
| Input Tokens | 227,992 |
| Cached Tokens | 3,088,384 cache read; 0 cache write |
| Output Tokens | 96,124 |
| Total Tokens or Credits Used | 3,412,500 |
| Estimated Cost | About $5.15 at Cursor Grok 4.7 Fast short-context list price ($4 input, $1 cache read, $12 output per 1M). Slightly above I7B ~$5.05 because +64K input outweighed −87K cheap cache. Long-context ~1.5× ≈ $7.73. Other-harness comparison ≈ $1.86 (not billed). |
| Elapsed Time | 15m 43s |
| Number of Human Interventions / Redirects | 0 during the scored chat |
| Reviewer Notes | (leave blank for now) |
| Final Rubric Score | (leave blank for now) |
| Recommendation | Continue |
