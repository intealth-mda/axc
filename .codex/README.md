# Codex harness for agentCourses

What is in here and how to rerun it on another machine.

| File | Purpose |
| --- | --- |
| `../AGENTS.md` | Rules the agent reads on every request: definition of done, scope, repo map, token discipline |
| `../.agents/skills/cellix-slice/SKILL.md` | CellixJS layout and patterns, loaded only when the agent works on a feature |
| `../.agents/skills/{turborepo,portless}/agents/openai.yaml` | Keeps main's turborepo and portless skills out of the agent's skill list (see below) |
| `config.toml` | Model and reasoning effort (`gpt-6.1-sol`, medium), so every machine runs the same settings |
| `hooks.json` | Registers the two hooks below |
| `hooks/verify-gate.mjs` | `sync` (after each tool call): if a `package.json` changed, runs `pnpm install` outside the sandbox. `stop` (when the agent finishes): checks the write boundary, then runs what CI runs (`pnpm install --frozen-lockfile`, `pnpm run verify`) and sends back only the failing lines, at most 3 times |

Hook logs and the manifest fingerprint go to `.agents-work/verify-gate/` (gitignored). They are evidence only and never feed back into a run.

The turborepo and portless skills came with main and stay as they are. Each has an `agents/openai.yaml` with `allow_implicit_invocation: false`, the setting Codex uses for its own built-in `review-agent` skill. Codex then leaves them out of the agent's skill list, so feature runs neither pay for their descriptions nor open them, and a person can still call them with `$turborepo` or `$portless`. `[[skills.config]]` can't do this here: Codex 0.162.1 ignores it in a project's `config.toml`.

## Prerequisites

Same as the repo README: Node 24 (`nvm use`), pnpm 11.11.0 (via corepack), Azure Functions Core Tools v4, a JRE, and an authenticated Snyk CLI. Codex CLI 0.162.1 (`npm i -g @openai/codex@0.162.1`), signed in with ChatGPT Business. A CellixJS checkout at `/Volumes/files/src/cellixjs`, which AGENTS.md and the cellix-slice skill name as the reference architecture. Mac or Linux: the hooks call `/usr/bin/git` and `/bin/sh`.

## Running a task

1. Use a regular `git clone`, not a `git worktree`. For a worktree, Codex reads `.codex/` from the main checkout, so this harness would not load.
2. Check out the harness branch and run `pnpm install --frozen-lockfile`.
3. Trust the folder in `~/.codex/config.toml`:
   ```toml
   [projects."/path/to/your/clone"]
   trust_level = "trusted"
   ```
4. Check that the agent sees only this harness, at no token cost: in the clone, `codex debug prompt-input | grep -o -E -- '- [a-z0-9:_-]+: ' | sort -u` should list `cellix-slice` and Codex's built-in skills (`imagegen`, `openai-docs`, `skill-creator`, `skill-installer`) and nothing else. Plugins and skills installed in your home folder load in every project, so turn off anything else that shows up in `~/.codex/config.toml`: `enabled = false` under `[plugins."<name>"]`, or a `[[skills.config]]` entry with the skill's absolute `path` and `enabled = false`. Each run record lists what was turned off.
5. Start `codex` in the clone and approve the hooks when asked. `/hooks` should then show PostToolUse 1 and Stop 1, and `/status` should show `Agents.md: AGENTS.md` and GPT-6.1-Sol medium.
6. Paste the task prompt (`task-set-a-prompt.md` or `task-set-b-prompt.md`) as is, and approve nothing beyond plain one-time prompts.

Token usage and estimated cost: `node scripts/codex-session-usage.mjs --latest` in the clone, or pass a rollout file. It reads the last `token_count` event in `$CODEX_HOME/sessions/YYYY/MM/DD/rollout-*-<session-id>.jsonl` (`CODEX_HOME` defaults to `~/.codex`).
