# AgentCourses agent instructions

Applies repository-wide. Preserve user changes, task scope, and the `apps/`, `packages/axc/`, `packages/axc-verification/`, and vendored `packages/cellix/` boundaries. Never stage, commit, push, or bypass hooks without an explicit user request.

## Boundaries

- Fixed `task-set-*-prompt.md` and `task-set-*-requirements.md` are immutable unless explicitly requested. Preserve `super-prompt.md` as the original scaffold brief. Keep `README.md` unchanged; put harness operating notes in `.agents/harness-run-workflow.md`.
- For Task Sets A and B, `packages/axc/data-sources-mongoose-models/**` is the narrow exception to the prompt's new-directory restriction. Create that workspace package and its context directories when persisted business objects require Cellix storage models, including fixture-backed Course and EnrollmentRequest. This permits neither another package nor a live database.
- Do not change vendored `packages/cellix/**` for application features. Port upstream changes exactly only when explicitly requested.
- Use Node from `.nvmrc` and pnpm from `package.json`. Preserve `.npmrc`'s `ignore-scripts=true` and disabled dependency builds in `pnpm-workspace.yaml`; prefer existing tools and standard-library scripts.

## Routing

- For implementation, review, and harness maintenance, follow the [run workflow](.agents/harness-run-workflow.md). It owns scope, context gathering, dependency decisions, the single working record, and call-efficient verification. Read fixed requirements once per run and re-read only when they change or a specific uncertainty requires it.
- Before implementing or reviewing changes under `apps/api`, `packages/axc`, or `packages/axc-verification`, load the [Cellix architecture skill](.agents/skills/cellix-architecture/SKILL.md) and its mandatory references according to their triggers. Review affected references when changing harness architecture rules. Classify concepts by identity and lifecycle before choosing files; neither a query-only API nor a small endpoint count removes aggregate obligations.
- For implementation or completion verification, follow the [security policy](.agents/verification-policy.md), including all-severity pnpm audit and Snyk availability handling. Do not treat ignored, unavailable, or unexecuted checks as passed.

## Completion

Complete the [Cellix alignment review](.agents/skills/cellix-architecture/references/review-template.md) for applicable feature changes in the working record. Run focused checks, then **`pnpm run verify` after the final implementation change**. Do not substitute a smaller gate or weaken architecture, acceptance, security, documentation, or verification checks. Resolve patch-introduced Biome, Knip, rendered-documentation, test, and security findings.

Review tracked, staged, and untracked changes against the initial snapshot and task boundary. Run `git diff --check` and `git diff --cached --check`. Report fresh versus cached evidence, failures and unexecuted stages, usage source and inclusion semantics, and remaining limitations honestly.
