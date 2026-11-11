# agentCourses (axc) — working notes for coding agents

Your change is done when `pnpm run verify` passes.

## Stay inside the write boundary

The task prompt names the paths you may write.

- Use packages already in the workspace. Adding one rewrites `pnpm-lock.yaml`
  at the repo root, outside every task boundary; if one is unavoidable, say so
  in your summary.
- Keep `packages/axc/domain/**` free of infrastructure. `test:arch` reads every
  `.ts` under `domain/src`, tests included, and fails on the strings `hono`,
  `@azure/`, `mongoose`, `mongodb`, `@axc/rest`, `@axc/persistence`,
  `@axc/service-mongoose`, `@axc/application-services`. A domain test that
  needs a database goes in `packages/axc-verification/**`.
- Reuse `packages/cellix/**` as it is: it is vendored from CellixJS upstream
  and must match its source. An app-specific copy of one of its packages is a
  review failure: `api-core` (bootstrap, service lifecycle) · `api-services-spec` ·
  `domain-seedwork` (DDD primitives) · `mongoose-seedwork` (repository, unit of
  work) · `serenity-framework` (Screenplay/Cucumber) ·
  `server-mongodb-memory-mock-seedwork` · `event-bus-seedwork-node` ·
  `local-dev` · `config-typescript` / `config-vitest` / `config-rolldown` ·
  `archunit-tests`.

## Start with the map

Read the **axc-orientation** skill first: layout, route/service/test patterns
and self-checks in one place. Then read only the files you will change.

## Gates

`pnpm run verify` runs ten gates (script policy, biome, typecheck, build, knip,
e18e, architecture, unit + acceptance tests, audit, snyk) and takes minutes,
mostly acceptance. While iterating, use the cheapest check:

| need | command |
|---|---|
| format + lint one path | `corepack pnpm exec biome check --write <path>` (biome wants TABS) |
| typecheck + unit tests, one package (builds the workspace packages it imports first; a bare `tsgo --noEmit` reads their missing or stale `dist` and reports TS2305) | `corepack pnpm exec turbo run typecheck test --output-logs=errors-only --filter=@axc/<pkg>` |
| architecture rules only | `corepack pnpm exec turbo run test:arch --force` |
| all files written: biome --write, typecheck + tests of changed packages, coverage/cellix/knip/mdx/spec | `python3 .claude/hooks/precheck.py` |
| everything, before you claim done | `python3 .claude/hooks/gate_digest.py` |

End the call that writes the last files with this chain (allow it 10 minutes):
`python3 .claude/hooks/precheck.py && python3 .claude/hooks/gate_digest.py`. The gate runs only
on a clean precheck, in the same turn. After a fix, run the same chain.

`gate_digest.py` runs verify once and prints the exit code (first and last
line), each gate's result, test and scenario counts, and the failing gate's
errors. Quote it as your evidence instead of grepping `/tmp/verify.log`. A
passing run is final: do not run it again to re-read its output. Report a
SKIPPED gate as skipped, not passed.

## Build the smallest thing that passes

Apply the **ponytail** skill: the laziest solution that meets every numbered
requirement and passes verify. Reuse before writing, one file before four, no
abstraction with one caller. The map's four layers and per-entity file shapes
are the house standard: be minimal inside them.

## Output

Code and tests are the deliverable; output tokens are scored. Write in
**caveman** style.

- Batch independent work into one turn: several files in one Bash call (one
  heredoc per file), independent reads and checks in one response. Every turn
  re-reads the whole context.
- One line of intent before a batch of tool calls. No preamble, no restating
  the task, no echo of a file you wrote or a diff the reader can read.
- Plan briefly, one batch at a time (the map's write order). Reasoning is
  billed as output and re-read every turn. Settle each open choice once, with
  the map's house default where it has one, then write. Do not draft files in
  your head first: the precheck catches slips, and a fix turn costs less than
  a long plan.
- Finish with a table: one row per numbered requirement and per acceptance
  criterion, PASS/FAIL, and the test or file that proves it. A requirement
  with only your word as evidence is not done. Then the commands you ran with
  their real output, and any limitations.
