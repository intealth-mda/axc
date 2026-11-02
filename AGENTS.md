# AXC Agent Instructions

AXC application development follows CellixJS architecture and conventions.

## Sources of Truth

Use these sources for their respective concerns:

1. The task prompt and referenced task-set requirements define required behavior
   and scope.
2. `/Volumes/files/src/cellixjs` is the authoritative reference for CellixJS
   architecture, framework usage, and implementation patterns.

When implementing application behavior, inspect the relevant Cellix patterns
rather than inventing alternatives from generic knowledge.

Do not modify or weaken repository guardrails to make an implementation pass.

For local application wiring, runtime, and verification conventions, follow
existing AXC code. Use CellixJS as the authority for DDD architecture,
framework usage, and patterns not already established in AXC.

## Repository Map

- `apps/` — application entrypoints and composition roots.
- `packages/axc/` — AXC application implementation, adhering to CellixJS architecture and conventions.
- `packages/axc-verification/` — acceptance and architecture verification for AXC.
- `packages/cellix/` — reusable Cellix framework packages consumed by AXC.
  Do not modify existing framework packages. If required Cellix capability is
  missing, port the relevant package from `/Volumes/files/src/cellixjs` rather
  than recreating it within AXC.

## Application Development

Use the project skills when applicable:

- `cellix-ddd` for domain modeling, application layering, and Cellix DDD.
- `tdd` for outside-in test-driven application development.
- `serenity-tests` for Serenity/JS acceptance testing.
- `run-validation` for development and final validation.

`turborepo` and `portless` are slash-command skills. Do not load them for ordinary application work.

## Feature slice

Orient once. Read the task prompt and the requirements file it names, then the closest feature of the same shape. For HTTP, start from `GET /health`: `packages/axc/rest/src/index.ts`, `apps/api/src/index.ts`, `packages/axc/application-services/src/index.ts`, and `packages/axc-verification/acceptance-api/src/step-definitions/healthcheck.steps.ts`. Open another file only when that slice, the specification, or a compiler or test error names it. Do not list the repository, and do not open skill reference trees unless a skill names one file.

Keep each `packages/axc/*/src/index.ts` a composition root. Put feature behavior under the Cellix context layout from `cellix-ddd`, and put stored catalog or enrollment state through `@axc/persistence` and `@axc/service-mongoose`. In-memory Mongo is the backing store. Do not park that state in an application-service array because an adapter is still unused.

Add one acceptance scenario for each named acceptance criterion. For each validation rule, add one boundary test and one negative test at the cheapest layer that proves it. When a 400 lists several fields, assert the field set, not the order, unless the specification orders it. Re-export every type or value another package imports from that package's `src/index.ts`.

While editing, run the narrowest test for the package you changed. Do not run `pnpm run verify`, Knip, audit, or Snyk yourself, and do not add a dependency or edit `pnpm-lock.yaml`. The pre-commit hook runs lint-staged and `pnpm run verify`. On failure it prints a short excerpt and the full log path. Fix the cause and commit again. Do not use `--no-verify` or weaken a guardrail.

## Completion

Before completing a change:

- satisfy the requested behavior and scope;
- follow applicable Cellix architecture and repository conventions;
- follow the project's TDD and testing practices;
- pass the applicable repository validation.

When implementation is complete:

1. Review the working tree and stage only the intended changes.
2. Commit the completed implementation normally. Do not bypass the pre-commit
   hook or use `--no-verify`.
3. If the pre-commit hook fails, fix the underlying issue and retry the commit.
4. After a successful commit, push the current branch to its corresponding
   remote branch.
5. For an AXC output branch
   `<initials>-<vendor>-<iteration>-<attempt>-out`, derive the PR base by
   removing `-<attempt>-out`.
6. If no pull request exists for the current output branch, open one targeting
   the derived iteration base.
7. Do not merge the pull request.