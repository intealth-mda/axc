### Evaluation Run Record 
Each participant should complete one Evaluation Run Record per harness/model run. 

| Field | Value |
| --- | --- |
| Team | OpenAI |
| Developer / Operator | Duy Nguyen |
| Reviewer | (leave blank for now) |
| Harness | Codex VS Code; codex_vscode 0.164.0-alpha.11.1 |
| Model | gpt-6.1-sol |
| License / Plan | Unavailable; authentication type and plan type null in supplied metadata |
| Codebase | ECFMG/axc |
| Task Set | B — TS-B-COURSE-ENROLLMENT-WORKFLOW; includes Task Set A search |
| Run Type | Harness-engineered run; branch suffix 11, iteration designation not independently established |
| Harness Engineering Used | Repository AGENTS.md, harness run workflow, Cellix architecture skill and local reference; no subagents |
| Config / Diff Notes | 14 tracked implementation files changed and 61 new implementation files; feature layers, schemas, tests, API docs and MADR. Generated lockfile includes justified workspace/test edges and two MongoDB snapshot resolutions. Evaluation files are separate from implementation. Node 24.21.0; pnpm 11.11.0. |
| Branch / Commit | dn-oai-11; starting/current HEAD fd9052b067b8ddfa6222307dbacf0a6223648ebc; implementation remains uncommitted |
| Requirements Completed / Attempted | B1–B17: 17/17 supported; A1–A11: 11/11 supported. See evidence in evaluation-run-record-scoring-details.md. |
| Acceptance Criteria Passed / Total | B: 15/15 supported; inherited A: 12/12 supported. These are specification criteria, not scenario counts; running-host suite contains 2 feature scenarios plus 1 health scenario. |
| Tests Passed / Failed | Scored run: 670 reported Vitest results, 0 failures at final gate; separate architecture stage 30 AXC + 10 Cellix, docs 3 node tests, host 3/3 scenarios. Counts include runtime/typecheck projects and cached results. Evaluation fresh focused tests: domain 75, models 4, persistence 15, application 36; fresh AXC architecture 30. See details for cache provenance and gate rerun. |
| Static Analysis / Security Findings | Scored final gate passed script policy, Biome, typecheck, build, rendered docs, Knip, e18e, architecture and tests. Knip configuration hints and quiet-mode e18e diagnostics are limitations, not clean findings. Audit/Snyk and other security scans were not requested or run; no security clearance claimed. |
| Input Tokens | 5,513,596 (includes cached input) |
| Cached Tokens | 5,412,864 included in input; cache-write input 0 |
| Output Tokens | 38,235 (includes 4,018 reasoning output tokens) |
| Total Tokens or Credits Used | 5,551,831 tokens = input + output; credits unavailable in local session log |
| Estimated Cost | Unavailable; no pricing, billing or credit evidence supplied |
| Elapsed Time | 15m 40s; active 940,267 ms, wall 940,000 ms (supplied metadata). 2026-11-09 01:13:38.039–01:29:18.256 UTC; Nov 8, 8:13:38–8:29:18 PM EST. Excludes this evaluation. |
| Number of Human Interventions / Redirects | 0 follow-up user redirects visible in export; approval interactions are not separately exposed as human-intervention counts |
| Reviewer Notes | Task Set B and inherited Task Set A criteria are supported; full verification and fresh API-host acceptance passed. No meaningful security findings; guardrails were followed (5/5). Reviewer feedback: harness engineering clearly improved quality, cost, speed and repeatability (5/5); 5,551,831 tokens and 15m 40s represent very good efficiency (5/5). Developer workflow fit is 4/5 due to setup and verification retries. Operational/vendor readiness is 4/5: likely approvable, with enterprise license and organizational approval details still unverified. Dollar cost remains unavailable; security scans were not requested or run. Comparative improvement reflects reviewer feedback rather than an independently reviewed matched baseline. |
| Final Rubric Score | 97/100 — incorporates reviewer feedback; reviewer identity/sign-off remains pending |
| Recommendation | Candidate for Pilot — 97/100; designation confirmed by the user. |