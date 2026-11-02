---
name: axc-development
description: Implements and validates agentCourses features with repository layering, minimal context, focused tests, documentation, and final verification. Use when adding or changing application behavior in apps/api, packages/axc, packages/axc-verification, or apps/docs.
---

# agentCourses development

## Workflow

1. Read the task prompt and requirements once.
2. Inspect the affected package, its public exports, and its direct dependencies.
3. Reuse the nearest existing implementation, test, and documentation pattern.
4. Change only the layers and minimum file set required to satisfy the task. Do not edit unrelated files or unrelated tests.
5. Keep domain contracts inward. Construct and inject concrete infrastructure in `apps/api`.
6. Before writing tests, confirm public exports, project references, and the repository's comparison or ordering convention. Keep this preflight internal. If several tests need the same stubs, use one shared test helper with overrides instead of editing each old test.
7. Complete one pass across code, exports, project references, tests, and required documentation. Do not tour tooling configs before the first write.
8. Before verification, check the task requirements once and keep that checklist internal.
9. Validate with only the new or changed test file(s) for the edit through `node scripts/agent-check.mjs -- <command>`, then one wrapped `pnpm run verify`. Do not run `pnpm install`.
10. Report what changed, the commands, results, limitations, any dependency justification, and security findings.

The one-pass rule controls tool calls. Ponytail and Caveman still apply in full. Do not restate those rules.
