# Verification and security policy

Mandatory for implementation, completion verification, and remediation, even when an earlier gate stage fails. `pnpm run verify` remains the final gate; focused checks supplement it.

## Evidence

- In addition to the gate's `pnpm run audit`, run `pnpm audit --audit-level=low --json` and inspect every severity. The current audit script uses `--audit-level=high`; a zero exit does not prove low or moderate advisories are absent. Record open, policy-ignored, and unavailable findings separately.
- Inspect Snyk through `pnpm run snyk`, separately if the gate stopped before it. Reuse a completed scan within the same run when dependencies, policy, registry availability, and credentials are unchanged; record its source and freshness. An unavailable CLI or credential is an environment limitation, not a passing scan.
- For each finding, record ID, package, installed version, dependency path, affected range, published fixed version, actual registry availability, and comparison with the baseline. Keep raw output in a log and return only relevant diagnostics to the model.

## Remediation

- Prefer the narrowest compatible `pnpm-workspace.yaml` override; align direct catalog pins when needed, refresh the lockfile, inspect peers and major-version compatibility, and rerun both scans plus affected tests against the installed tree. Snyk's “no direct upgrade” label does not prove a transitive override is impossible. For a major override, inspect the dependent package's actual API usage and composed build/tests.
- Add a Snyk issue ID to `.snyk` only when no usable fixed release exists; include the specific reason, creation date, and near-term expiry. Review pnpm's separate `auditConfig.ignoreGhsas` with a compatibility or availability reason and recheck date. Remove stale ignores. A Snyk ignore never resolves a pnpm audit failure.
- Do not weaken scan settings, architecture gates, or acceptance checks to silence findings.

## Unavailable stages

Retry an unchanged security or registry command with required network permission when availability is the problem. If still unavailable, preserve the exact failure, run every stage skipped by the stopped gate, and report each result. Correct missing CLI or credentials rather than repeatedly retrying the same command. Do not call skipped, unavailable, or unexecuted stages passed. Product, architecture, docs, formatting, Knip, and test failures are blockers to fix.

Snyk runs locally through `scripts/snyk-verify.mjs` with `test --all-projects --policy-path=.snyk`; never use `monitor` or `--remote-repo-url` for this gate.
