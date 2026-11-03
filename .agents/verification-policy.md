# Verification and security policy

Mandatory for implementation/completion verification and remediation, including when an earlier stage fails. Explanatory replies and status updates alone do not start a verification loop. `pnpm run verify` remains the full completion gate; focused checks supplement it.

## Required evidence

- The current `pnpm run audit` script uses `--audit-level=high`. In addition to the full gate, run `pnpm audit --audit-level=low --json` and inspect its findings: every unignored severity blocks completion. Do not describe the script as all-severity enforcement or treat a zero gate exit as complete security evidence.
- Inspect Snyk via `pnpm run snyk`, separately if the gate stopped before it. Never repeat the same gate stage merely to obtain a second copy of its result. Within a run, reuse recorded scan evidence for unchanged dependencies, policy, registry availability, and credentials; rerun after relevant changes or recovery. Record freshness/source rather than treating stale results as fresh. This does not replace the required final full gate.
- Record finding ID, package, installed version, dependency path, affected range, published fixed version and actual registry availability; compare baseline. Keep open, ignored, and unavailable findings separate. Successful commands do not prove ignored advisories disappeared.

## Remediation

- Prefer the narrowest compatible `pnpm-workspace.yaml` override, aligning direct catalog pins when needed; refresh the lockfile within the task boundary and rerun both scans against the installed tree plus relevant tests. Snyk's “no direct upgrade” does not establish that a transitive override is impossible. Check peers and major compatibility; for major overrides inspect the dependent package's actual API usage and composed build/tests.
- Only when no usable fixed release exists may a Snyk issue ID enter `.snyk`, with specific reason, creation date, and near-term expiry. Recheck ignores on expiry or new fixes. Review pnpm's separate `auditConfig.ignoreGhsas` with a compatibility/availability reason and recheck date; remove stale ignores. A Snyk ignore cannot resolve a pnpm audit failure. Do not weaken policy to silence findings.

## Unavailable stages

Retry unchanged security/registry commands with required network permission when availability is the problem. If still unavailable, preserve the exact failure and execute every stage that did not run, sequentially for shared build artifacts. Missing CLI/credentials require an environment correction, not repeated network retries. Never call skipped, unavailable, or unexecuted stages passed. Product, architecture, docs, formatting, Knip, and test failures are blockers to fix.

Snyk runs locally with `test --all-projects --policy-path=.snyk`, never `monitor` or `--remote-repo-url`. Its helper fails when the CLI cannot run; the original scaffold-only skip does not apply to subsequent completion. An unavailable scan remains an explicit verification limitation.
