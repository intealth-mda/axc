# AgentCourses agent instructions

Applies repository-wide. Preserve user changes, task scope, and the `apps/`, `packages/axc/`, `packages/axc-verification/`, and `packages/cellix/` boundaries. Never stage, commit, push, or bypass hooks without an explicit user request.

## Boundaries and routing

- Fixed `task-set-*-prompt.md` and `task-set-*-requirements.md` are immutable unless explicitly requested. Preserve `super-prompt.md` as the original scaffold brief.
- Keep `README.md` unchanged. Put harness operating notes in the [harness usage guide](.agents/harness-usage.md).
- Do not modify vendored `packages/cellix/**` for application features. Port upstream changes exactly only when explicitly requested.
- For implementation, review, or harness maintenance, follow the [run workflow](.agents/harness-run-workflow.md). It owns scope/dependency decisions, deliberate context gathering, and the single working record.
- Before implementing or reviewing changes under `apps/api`, `packages/axc`, or `packages/axc-verification`, load the [Cellix skill](.agents/skills/cellix-architecture/SKILL.md) and its mandatory references according to their triggers. Harness edits to those rules must review the affected references too. Classify concepts by identity and lifecycle before choosing architecture; neither folders, endpoint counts, nor apparent simplicity permits bypassing this step.
- Use Node from `.nvmrc` and pnpm from `package.json`. Preserve `.npmrc`'s `ignore-scripts=true` and disabled dependency builds in `pnpm-workspace.yaml`; prefer existing tools and standard-library scripts.

## Completion

Complete the [alignment review](.agents/skills/cellix-architecture/references/review-template.md) for applicable changes, reusing the working record. Run focused checks, then **`pnpm run verify`** after the final implementation change. Never substitute a smaller gate. The optional `node scripts/verify-quiet.mjs` runs this same gate and retains full output.

The gate covers dependency-script policy, Biome, typecheck, build, rendered docs, Knip, dependency efficiency, architecture, full tests/acceptance, audit, and Snyk. Resolve patch-introduced findings, including formatting/import order, unused exports/types, and rendered documentation failures. Do not weaken architecture, acceptance, security, documentation, or verification gates.

Follow the mandatory [security policy](.agents/verification-policy.md) for implementation/completion verification and remediation, even if an earlier stage stops the gate. Never conceal failures or describe skipped/unavailable scans or unexecuted downstream stages as passed. Review tracked, staged, and untracked changes against the initial snapshot and task boundary; run working and staged diff whitespace checks. Follow the task's reporting requirements with fresh versus cached verification evidence and honest limitations.
