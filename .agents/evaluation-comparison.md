# Comparable harness evaluations

Load only when measuring or comparing harness runs. Keep the existing [evaluation form](../evaluation-run-record.md) unchanged; capture the following supplemental evidence in the [single working record](harness-run-workflow.md#one-working-record).

## Controls and procedure

1. Prepare one synchronized source/dependency baseline and baseline verification results. Remediate baseline security issues in separately authorized maintenance. Create two disposable local worktrees from that same source; apply the baseline harness to one and candidate harness to the other. Record exact harness revisions/patch digests. Do not stage, commit, push, or mutate remotes without authorization.
2. Use the same fixed task/requirements hashes, allowed paths, model/version/settings, initial context/cache policy, tools/permissions, OS, Node/pnpm versions, lockfile hash, install command, and external services. Install with `pnpm install --frozen-lockfile --ignore-scripts`. A controlled seed commit is allowed only if the fixed task permits it and both arms use it. Record unavoidable differences; keep different starting points in separate comparisons.
3. Hold verification policy constant: focused checks, full `pnpm run verify`, supplemental all-severity audit JSON, Snyk availability treatment, rendered documentation, and Cellix review. Apply policy corrections equally to both arms rather than counting them as the experimental variable. Run arms sequentially when sharing artifacts or services.
4. Use fresh sessions and identical usage sources/windows. Capture cumulative snapshots at start, after scope/reference gathering, implementation, focused checks/review, and verification/reporting. Derive phase deltas from successive snapshots. Include tool/retry/delegated-agent usage when exposed. Record elapsed wall time and each human intervention/redirect.
5. Compare total and phase usage alongside acceptance passed/total distinct executed cases, architecture compliance/deviations, test/documentation results, full-gate exits/logs, cache hits, security findings, and failed/unexecuted stages. Record outages as external limitations and rerun unchanged scans after recovery, without scoring them as generated-code defects. Repeat matched pairs before generalizing; label confounded runs separately.

## Metric semantics

Keep input, cached input, output, and reasoning counters separately visible with measurement source/export path and inclusion semantics. If cached input is a subset of input, do not add it again; if reasoning is included in output, do not add it again. Unknown semantics mean derived totals are unavailable. Mark unavailable counters explicitly; never estimate them from file sizes.

Record phase timestamps, deltas, whole-run totals, elapsed time, model/settings/environment, harness revision, acceptance/architecture results, interventions, and verification status. Keep tokens and credits distinct. Cost claims require billing/pricing evidence and plan semantics. File bytes/word counts are context-size proxies, not measured token or cost savings. Report savings only from comparable observed counters.
