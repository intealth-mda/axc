# Harness run workflow

Applies to implementation and review runs. For explicitly authorized harness maintenance or evaluation edits, use the same boundary, record, and verification discipline; classify architecture work as not applicable only when no product/domain behavior changes. Do not apply feature-specific requirements to unrelated maintenance.

## Establish scope once

1. Record starting branch, commit, and working/staged/untracked status; preserve existing user changes. Read fixed task requirements once and extract exact allowed paths, prohibitions, acceptance criteria (including quantities), and existing behavior to preserve. Re-read when requirements change or uncertainty requires it.
2. Check workspace dependency edges against manifests before implementation. Justified dependencies permitted by the task also permit generated root lockfile updates for manifests inside the allowed boundary unless explicitly prohibited. Explain each edge first and limit lockfile changes to it and unavoidable package-manager metadata. Obtain a boundary exception for other root configuration or unrelated lockfile changes. Never flatten architecture or use undeclared imports to avoid dependencies.
3. Consult comparable baseline verification evidence, including advisories, Biome, and Knip. If absent, run `pnpm run knip` before edits and distinguish actionable findings from configuration hints or setup failures. Do not edit root Knip configuration or scan ignores merely to silence bounded-feature findings.

## Gather context deliberately

- Discover paths with targeted `rg --files` and symbol searches before bounded content reads. Do not dump lockfiles, generated artifacts, whole directories, unrelated framework source, or whole diffs into context.
- Load the [Cellix skill](skills/cellix-architecture/SKILL.md) when routed by AGENTS. Classify concepts first; select the closest slice by domain behavior/ownership. Inspect applicable composition files, exports, interfaces, and test companions. Reuse its reference index instead of repeatedly exploring Cellix; an index never replaces required source inspection.
- Retain inspected source paths and relevant decisions in the record below. Re-read changed files or uncertain details; avoid rereading stable instructions and source without a reason. Missing authoritative references are a limitation to resolve or report, never permission to invent alignment.

## One working record

Use one compact Markdown record per run at `.agents-work/<run-id>/record.md` (already ignored) if the task authorizes that location; otherwise use an authorized temporary path and record its location. No per-run notes in tracked source. Save raw tool output as `.log`; format structured JSON if retained, since Biome also scans ignored agent files. The tracked evaluation form is a reusable template, not an extra planning matrix.

Maintain these sections, updating only changed information:

| Section | Required content |
| --- | --- |
| Baseline and scope | Branch/commit/status, allowed paths, prohibitions, acceptance criteria and quantities, tools/settings, baseline findings |
| Classification | Each concept's identity/lifecycle evidence, aggregate/child/value/projection decision, chosen context; query-only aggregates and deferred commands |
| Reference → destination | Exact files, owning responsibilities, planned exports/composition/test companions, selected slice and reason; every applicable omission with behavior-based justification |
| Decisions | Dependency edges, lockfile/boundary decisions, implementation choices, deviations and later migration cost |
| Evidence | Each criterion → source, focused test input/expected result/location, composed host acceptance and documentation; incorrect implementation rejected; distinct case counts |
| Verification | Commands, fresh/cache status, exit/signal, logs, findings/remediation, ignored/open/unavailable scans, remaining issues |
| Usage | Available counters/source, elapsed time and interventions; load [comparison guidance](evaluation-comparison.md) only for usage evaluation |

For harness-only maintenance, record affected requirements, authoritative homes, and preservation checks in the evidence section; no separate map file is required. Explain why domain implementation rows are inapplicable. Reuse this same record for planning, alignment review, and final reporting; do not generate overlapping plans or matrices.

## Implement, review, finish

- Apply the skill's shared, command (when triggered), and behavioral-evidence references. Inspect exact applicable source before coding; implement and test rules at their owning layer, then the composed public path.
- Start with focused checks. Run shared build-dependent commands sequentially; simultaneous Turbo pipelines can mutate the same artifacts. Repeat successful checks only after relevant changes, failures, or environment corrections. Distinguish cache hits, fresh execution, and sandbox startup failures corrected by an unchanged authorized rerun.
- When changing the verification wrapper, run `node --test scripts/verify-quiet.test.mjs`; the root test pipeline does not discover these script tests.
- Complete the [review](skills/cellix-architecture/references/review-template.md) in the record. Resolve unexplained structural or semantic differences and patch-introduced findings; compare final Knip output to baseline hints.
- Run the AGENTS completion gate. For concise output use `node scripts/verify-quiet.mjs`; it saves complete stdout/stderr under `.agents-work/verification/` and propagates failure/signal status. Inspect logs on failure; gate termination leaves later stages unexecuted, not passed. Follow [security policy](verification-policy.md) even when earlier stages fail. If external scans remain unavailable, run every stage that did not execute and record each result.
- Compare `git diff --name-status`, `git diff --cached --name-status`, and `git ls-files --others --exclude-standard` with the baseline and exact boundary. Check prohibited authentication, production-setting, deployment, and unrelated behavior changes even inside allowed folders. Resolve agent-created violations without discarding user edits. Run `git diff --check` and `git diff --cached --check`.
- Report from this record, following the task's required format. Do not stage or commit automatically, bypass hooks, or invent cost/usage/vendor approval evidence.

## Comparable evaluations

For comparative evaluations only, load [comparison guidance](evaluation-comparison.md) and fill the existing [evaluation form](../evaluation-run-record.md) within the same run record. Routine feature runs need not load the comparison document.
