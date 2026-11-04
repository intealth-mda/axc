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
| Run Type | Harness Engineering Iteration 8 (Phase 1b retry) |
| Harness Engineering Used | I7 tip `c4fc5ed` plus Phase 1b only: bounded `agent-check` FAIL logs (≤40 lines / ≤4KB) and one-pass/skill guidance to `rg`/`tail` the `Log:` path. Explicitly **dropped** the rejected Phase 1 nearest-slice / “inject persistence” layering nudge that fattened the first I8A. Cellix `axc-architecture.mdc` unchanged. Audit override pin retained for publish hooks. |
| Config / Diff Notes | Dashboard delta for the winning retry. Cache read 1,079,040; cache write 0; input 151,693; output 52,618; total 1,283,351. Transcript `fd289b13-d7cf-4aee-a8bc-bdcfb626ccf3`: 21 turns, 72 tools, first write turn 10, 8 shells, **1** wrapped verify (PASS). Budget `{verifies:1, lastVerifyStatus:0}`. Lean courses path (domain/app-services/rest/api); no persistence package; no `health.test` patch. Earlier rejected I8A on `ef0563b` was 1.72M / ~$2.76 / 8m18 (fatter persistence path). Publication recovers this tree by replaying the winning transcript onto harness `212d5ce`. |
| Branch / Commit | `en-cur-8-a-out` @ `5abf82a`; harness `en-cur-8` @ `212d5ce` |
| Requirements Completed / Attempted | 11 / 11 (A1–A11) |
| Acceptance Criteria Passed / Total | 12 / 12 (A-AC1–A-AC12) from implementation, package tests, and course acceptance scenarios |
| Tests Passed / Failed | Application-services: 20 passed after recovery. Acceptance: course scenarios + healthcheck. Scored chat: one wrapped verify PASS. |
| Static Analysis / Security Findings | Domain/application-services build and tests passed independently after recovery. Cellix write boundary held. No new third-party deps beyond workspace `@axc/domain`. |
| Input Tokens | 151,693 |
| Cached Tokens | 1,079,040 cache read; 0 cache write |
| Output Tokens | 52,618 |
| Total Tokens or Credits Used | 1,283,351 |
| Estimated Cost | About $2.32 at Cursor Grok 4.7 Fast short-context list price ($4 input, $1 cache read, $12 output per 1M). Long-context ~1.5× ≈ $3.48. Other-harness comparison rates ≈ $0.98 (not billed cost). |
| Elapsed Time | 8m 52s |
| Number of Human Interventions / Redirects | 0 during the scored chat |
| Reviewer Notes | (leave blank for now) |
| Final Rubric Score | (leave blank for now) |
| Recommendation | Continue |
