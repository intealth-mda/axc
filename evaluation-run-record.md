# Evaluation Run Record — Iteration 9, Task Set B

Evaluated 2026-11-06. Feature output: `66a75d464ed77fcf19bd87530764f4538cdd931a` on `dn-oai-9-b-out`; starting commit: `caea84d7351f594714209a5de4b26b97c641e716`. Scored session: `01a1b2d1-124f-7d81-a16f-46e548a2d087`. See [scoring details](evaluation-run-record-scoring-details.md) for evidence and limits.

| Field | Value |
| --- | --- |
| Team | OpenAI |
| Developer / Operator | Duy Nguyen |
| Reviewer | Codex independent evaluation |
| Harness | Codex with repository `AGENTS.md`, Cellix architecture skill, run workflow, and verification policy |
| Model | `gpt-6.1-sol` (operator-supplied scored-session summary) |
| License / Plan | ChatGPT Business (`self_serve_business_prolite`) |
| Codebase | ECFMG/axc |
| Task Set | B, including Task Set A course search |
| Run Type | Harness Engineering Iteration 9 |
| Harness Engineering Used | Cellix architecture alignment, single working record, targeted verification, rendered-document checker, and all-severity security policy |
| Config / Diff Notes | Feature commit changes 77 files in allowed feature paths; the dependency configuration and lockfile were completed in follow-up commit `ac15d16`. No vendored Cellix source was changed. This review scores feature-output quality and excludes the pre-existing `happy-dom` type mismatch. |
| Branch / Commit | `dn-oai-9-b-out` / `66a75d464ed77fcf19bd87530764f4538cdd931a` |
| Requirements Completed / Attempted | 28 / 28 functional requirements supported by source review and executed tests |
| Acceptance Criteria Passed / Total | 27 / 27 supported by focused tests, whole-repository verification, host acceptance, and rendered docs; evidence depth varies by criterion |
| Tests Passed / Failed | Independent compatible-environment `pnpm run verify`: 32/32 Turbo test tasks, 2/2 host scenarios, 28/28 AXC architecture tests. Focused AXC suites: domain 59/59, models 4/4, persistence 10/10, application services 8/8, REST 95/95; 0 observed product-test failures. |
| Static Analysis / Security Findings | Biome, typecheck, build, rendered docs, Knip, dependency analysis, architecture, and tests passed after the dependency compatibility fix. All-severity pnpm audit: 1 low and 1 moderate policy-ignored, 0 open. Authorized Snyk: 0 open, 11 ignored (8 high, 3 medium) across 24 projects. No feature-attributable finding identified. |
| Input Tokens | 6,539,803 |
| Cached Tokens | 6,426,624 cached input, included in input tokens; cache write 0 |
| Output Tokens | 38,680, including 5,924 reasoning tokens |
| Total Tokens or Credits Used | 6,578,483 tokens; credits unavailable |
| Estimated Cost | Unavailable; no dollar estimate made |
| Elapsed Time | 16m 9s active; 16m 10s wall (operator-supplied scored-session summary) |
| Number of Human Interventions / Redirects | Unavailable from the supplied session summary |
| Reviewer Notes | Course search and enrollment behavior is broadly covered, including two discriminating filter combinations, direct application-boundary validation, transaction rollback, and audit history. Course filtering, sorting, and pagination sit in the application operation instead of the read repository, a minor Cellix placement deviation. Against Task Set B baseline `dn-oai-0-b-out` (67/100; 23/27 criteria supported), this run scores 20 points higher and supports 27/27, with fuller architecture and verification. It used 4.05× baseline total tokens and 3.49× active time. The model and starting commits differ, so this is an observed whole-run comparison, not an isolated harness effect. The pre-existing `happy-dom` mismatch is excluded from feature attribution. Current session usage is operator-supplied and its raw export was inaccessible here. |
| Final Rubric Score | 87 / 100 under all eight categories of `evaluation-category-scoring-rubric.md`; output-quality subtotal 62 / 65 |
| Recommendation | Candidate for cage match; vendor approval and policy-ignored findings still require review |
