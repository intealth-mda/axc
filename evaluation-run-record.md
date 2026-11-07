### Evaluation Run Record 
Each participant should complete one Evaluation Run Record per harness/model run. 

| Field | Value |
| --- | --- |
| Team | OpenAI |
| Developer / Operator | Unavailable in session export; output commit authored by Duy Nguyen |
| Reviewer | Codex evaluation, 2026-11-06 |
| Harness | Codex CLI with repository `AGENTS.md`, run workflow, and Cellix architecture skill |
| Model | `gpt-6-sol` |
| License / Plan | Unavailable; session export does not establish license or approval status |
| Codebase | ECFMG/axc |
| Task Set | B (`TS-B-COURSE-ENROLLMENT-WORKFLOW`, including Task Set A course search) |
| Run Type | Harness Engineering Iteration 10 |
| Harness Engineering Used | Repository instructions, Cellix alignment workflow, working record, focused checks, and full completion gate |
| Config / Diff Notes | 69 files changed, 1,225 insertions and 17 deletions from starting commit. Changes are in `apps/api`, `apps/docs`, `packages/axc`, and the root lockfile for declared workspace dependencies. The separate Mongoose models package is permitted by `AGENTS.md`; fixture storage remains in memory. No vendored Cellix, authentication, production configuration, or external integration changes. No matched baseline comparison supplied. |
| Branch / Commit | `dn-oai-10-b-out` / `222b6112a86a5771789df7df0668932e13fceeef`; start `91c767b5533fe11e00269703f21b3f0280351174` |
| Requirements Completed / Attempted | 17 / 17 Task Set B functional requirements implemented; course search also covers the Task Set A query contract. Functional review found no confirmed missing behavior, with coverage limitations below. |
| Acceptance Criteria Passed / Total | 15 / 15 supported by implementation and package-level tests; only health has a fresh Azure Functions host acceptance scenario. Feature endpoint behavior was tested through the composed Hono app, not the running host. |
| Tests Passed / Failed | Final gate exit 0: architecture 40 passed, 0 failed; package test pipeline 32/32 tasks passed, 0 failed, including 33 feature-focused tests; one fresh host health scenario passed. Final pipeline used Turbo cache for 31/32 test tasks, 18/18 architecture tasks, 19/19 build tasks, and 25/25 typecheck tasks. Earlier focused tests passed. |
| Static Analysis / Security Findings | Script policy, Biome, typecheck, build, docs check, Knip, and e18e exited 0. Knip reported 35 configuration hints; e18e hid 229 issues under `--quiet`. The implementation diff review found no boundary violation or exposed secret. User-owned security assessment is outside this record. |
| Input Tokens | 13,029,035 (includes 12,931,968 cached input) |
| Cached Tokens | 12,931,968 (subset of input, not additional) |
| Output Tokens | 39,822 (includes 5,435 reasoning output) |
| Total Tokens or Credits Used | 13,068,857 tokens = input + output; credits unavailable |
| Estimated Cost | Unavailable; no price or credit rate established |
| Elapsed Time | 18m 14s active and wall, 2026-11-06 21:13:39–21:31:53 EST |
| Number of Human Interventions / Redirects | **1 for the iteration:** none after the initial prompt in the original output session; one post-run user redirect corrected the evaluation workflow and reporting. |
| Reviewer Notes | The implementation spans domain, application, persistence, REST, docs, and focused tests. The final gate passed, but most final tasks replayed cache. Enrollment filters are asserted as a combined query, and host acceptance covers health only. The user had to correct the evaluation workflow once after the output run. Later harness and test improvements are reserved for the next iteration and are not credited to commit `222b611`. Baseline quality, vendor approval, and monetary cost were unavailable. See `evaluation-run-record-scoring-details.md`. |
| Final Rubric Score | **68 / 100**, provisional pending user-owned security assessment (category evidence in scoring details) |
| Recommendation | **Remediate** before pilot consideration: add running-host feature acceptance and obtain vendor review; use a matched baseline before claiming harness gains. |
