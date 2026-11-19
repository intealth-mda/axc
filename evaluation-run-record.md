### Evaluation Run Record 
Each participant should complete one Evaluation Run Record per harness/model run. 

| Field | Value |
| --- | --- |
| Team | xAI |
| Developer / Operator | Mohit Gupta |
| Reviewer | (leave blank for now) |
| Harness | None. True no-harness baseline: Grok Build with no AGENTS.md, no .grok, no Stop hook, no repo map. Branch mog-xai-12-b-out, started on top of the baseline a-out record commit d0f2bae7d09a7a9180e9685e1cbc3e9ec853e0fa (which sits on 9c890d75784ea7a18fe0c192cfacfdcdaa1ef111). |
| Model | grok-4.7-build, reasoning effort medium |
| License / Plan | |
| Codebase | ECFMG/axc |
| Task Set | B (TS-B-COURSE-ENROLLMENT-WORKFLOW), built on the baseline a-out result |
| Run Type | True no-harness baseline b-out on top of baseline a-out d0f2bae (prompt sha1 4b7fbcd42688ff5bccff00b5be9a8fb72dd66252) |
| Harness Engineering Used | None. Launched with --trust --no-memory and web/agent/image tools disallowed. |
| Config / Diff Notes | BLUF: baseline b-out passes the tests at 2,710,324 tokens / 35 calls / $0.6321. Session 01a1f21e-cd76-7bb1-a29c-d4056894a1c4. Without a Stop hook the model did not commit; the owner committed afterwards with --no-verify (approved) because the pre-commit `pnpm run verify` fails at `pnpm audit --audit-level=high` (same 47 third-party advisories as the a-out baseline: 5 low / 23 moderate / 16 high / 3 critical). This record commit also used --no-verify under the same approval. Token sinks: (1) 95% of input was cached re-reads of the growing context across 35 calls (~76k tokens per call), fresh input only ~131k; (2) calls 1-18 (~4 min) were exploration reads/greps, no map; (3) writes were spread over 8 calls (all search_replace) with a 3m34s model-thinking gap between calls 19 and 20; (4) calls 27-34 were the model running its own checks with terminal commands. |
| Branch / Commit | mog-xai-12-b-out / feature c9ffb80ded7a5c2f6033bcd13da4ab89609d54c7 (owner commit after the run, --no-verify); start d0f2bae7d09a7a9180e9685e1cbc3e9ec853e0fa |
| Requirements Completed / Attempted | Enrollment request workflow implemented (domain, in-memory store, application service, REST routes /api/enrollment-requests, docs). B1-B17 not individually mapped. |
| Acceptance Criteria Passed / Total | Tests green: 31 acceptance scenarios passed (16 enrollment-requests + 15 course catalog). B-AC1-15 mapping not checked: the scenarios carry no B-AC tags. |
| Tests Passed / Failed | turbo test + test:acceptance 28/28 tasks; 31 acceptance scenarios; 52 application-services unit tests; 20 rest unit tests; 0 failed. |
| Static Analysis / Security Findings | verify: script policy, biome, typecheck, build, knip, e18e, test:arch, test PASS. pnpm audit FAIL (47 advisories in third-party deps, same as the a-out baseline). Snyk not reached inside verify; separate `pnpm run snyk` exited 1 reporting 8 of 23 projects with vulnerable paths plus a monthly private-test limit notice (unconfirmed). Cellix compliance report: 15 errors (5 domain, 2 persistence and 2 application-services files outside the required layout; layer rest not recognised; 5 routes defined in rest/src/index.ts instead of <feature>.routes.ts; 0 passport, 0 visa, 0 domain-permissions, 0 unit-of-work). |
| Input Tokens | 2654504 |
| Cached Tokens | 2523136 (inside Input) |
| Output Tokens | 55820 (reasoning 28926) |
| Total Tokens or Credits Used | 2710324 |
| Estimated Cost | $0.6321 |
| Elapsed Time | API 12m30s (Grok Build `/usage`); 35 model calls; wall time 23:44:27-23:59:15 America/New_York, Nov 18 2026 (14m48s) |
| Number of Human Interventions / Redirects | 0 during the run |
| Reviewer Notes | (leave blank for now) |
| Final Rubric Score | (leave blank for now) |
| Recommendation | Continue |
