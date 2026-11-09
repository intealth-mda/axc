# Agent instructions

Read these files before adding or changing domain, application service, persistence, mongoose model, GraphQL, or REST code. Follow them. Do not invent a second layout.

## Read first

- `.agents/skills/cellix-architecture/SKILL.md` — the commands, the files to edit, and which check to run. Open `REFERENCE.md` beside it when a lint or write error names a file role.

While the files are still changing, run `pnpm run agent-check -- pnpm run check`. When the behavior, the seed rows, and the acceptance steps are in place, run `pnpm run agent-check -- pnpm run verify` once. Do not write `.cellix/verify.json`.

## Do not edit

These are the control plane. A human changes them on purpose.

- `factory.json`
- `ocom-write.config.json`
- `packages/cellix/lint/**`
- `packages/cellix/generator/**`
- `.cursor/hooks.json`
- `.cursor/hooks/**`