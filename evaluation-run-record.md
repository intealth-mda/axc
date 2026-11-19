### Evaluation Run Record 
Each participant should complete one Evaluation Run Record per harness/model run. 

| Field | Value |
| --- | --- |
| Team | xAI |
| Developer / Operator | Mohit Gupta |
| Reviewer | (leave blank for now) |
| Harness | None. True no-harness baseline: Grok Build on the unmodified start commit 9c890d75784ea7a18fe0c192cfacfdcdaa1ef111 (no AGENTS.md, no .grok, no Stop hook, no repo map). Branch mog-xai-12-a-out. |
| Model | grok-4.7-build, reasoning effort medium |
| License / Plan | |
| Codebase | ECFMG/axc |
| Task Set | A (TS-A-CATALOG-SEARCH) |
| Run Type | True no-harness baseline on 9c890d7 (prompt sha1 5914b1cc2c83d4d287ee465c69fcca9bd65e868c) |
| Harness Engineering Used | None. Launched with --trust --no-memory and web/agent/image tools disallowed. |
| Config / Diff Notes | BLUF: baseline passes the tests but costs 4,430,919 tokens / 47 calls / $1.0165, about 9.4x the cheapest harness run with Cellix structure (mog-xai-9-a-out, 468,856). Session 01a1f200-6d81-7fe0-baec-7985891e4de2. Without a Stop hook the model did not commit; the owner committed afterwards with --no-verify (one-time approved exception) because the pre-commit `pnpm run verify` fails at `pnpm audit --audit-level=high` (47 advisories: 5 low / 23 moderate / 16 high / 3 critical, in third-party deps such as @storybook/addon-vitest and mongoose; likely pre-existing at the baseline commit, not confirmed on a clean checkout). This record commit also used --no-verify for the same reason. Token sinks: (1) 95% of input was cached re-reads of the growing context across 47 calls (~92k tokens per call), fresh input only ~205k; (2) calls 1-24 (~12 min) were exploration: 88 read_file, 16 grep, no map; (3) writes were spread over 8 calls (27 search_replace, 14 write); (4) calls 33-45 were the model running 13 terminal commands to verify itself (~142 s tool time). |
| Branch / Commit | mog-xai-12-a-out / feature e6aac3220dc47ad05834b236181fd087885757d3 (owner commit after the run, --no-verify); start 9c890d75784ea7a18fe0c192cfacfdcdaa1ef111 |
| Requirements Completed / Attempted | Not individually mapped to A-AC1..A-AC12; GET /api/courses catalog search implemented with in-memory seeded catalog, validation errors (INVALID_QUERY_PARAMETER), docs page. |
| Acceptance Criteria Passed / Total | Tests green: 15 acceptance scenarios passed. Per-criterion A-AC mapping not checked. |
| Tests Passed / Failed | turbo test + test:acceptance 28/28 tasks; 15 acceptance scenarios; 28 application-services unit tests; 14 rest unit tests; 0 failed. |
| Static Analysis / Security Findings | verify: script policy, biome, typecheck, build, knip, e18e, test:arch, test PASS. pnpm audit FAIL (47 advisories, see Notes). Snyk was not reached inside verify; a separate `pnpm run snyk` exited 1 reporting 8 of 23 projects with vulnerable paths plus a monthly private-test limit notice (result unconfirmed). Cellix compliance report: 7 errors (domain, persistence and application-services files outside the required contexts/datasources/models layout; layer rest not recognised; /api/courses defined in rest/src/index.ts instead of a <feature>.routes.ts; 0 passport, 0 visa, 0 domain-permissions, 0 unit-of-work). |
| Input Tokens | 4346091 |
| Cached Tokens | 4141056 (inside Input) |
| Output Tokens | 84828 (reasoning 61404) |
| Total Tokens or Credits Used | 4430919 |
| Estimated Cost | $1.0165 |
| Elapsed Time | API 20m23s (Grok Build `/usage`); 47 model calls; wall time 23:11:17-23:34:44 America/New_York, Nov 18 2026 (23m27s) |
| Number of Human Interventions / Redirects | 0 during the run |
| Reviewer Notes | (leave blank for now) |
| Final Rubric Score | (leave blank for now) |
| Recommendation | Continue |
