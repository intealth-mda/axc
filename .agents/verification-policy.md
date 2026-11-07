# Verification and security policy

Applies when audit or Snyk is explicitly requested. Task Set A/B harness runs use the verification command in [harness-run-workflow.md](harness-run-workflow.md) without these scans by default.

## Evidence

- Use `pnpm run audit` when requested. The script uses `--audit-level=high`; record its scope and do not describe a passing result as an all-severity scan. Record open, policy-ignored, and unavailable findings separately. Run additional severity checks only when explicitly requested.
- Inspect Snyk through `pnpm run snyk` when requested. Reuse a completed scan within the same run when dependencies, policy, registry availability, and credentials are unchanged; record its source and freshness. An unavailable CLI or credential is an environment limitation, not a passing scan.
- For each finding, record ID, package, installed version, dependency path, affected range, published fixed version, actual registry availability, and comparison with the baseline. Keep raw output in a log and return only relevant diagnostics to the model.

## Remediation

- Prefer the narrowest compatible `pnpm-workspace.yaml` override; align direct catalog pins when needed, refresh the lockfile, inspect peers and major-version compatibility, and rerun both scans plus affected tests against the installed tree. Snyk's “no direct upgrade” label does not prove a transitive override is impossible. For a major override, inspect the dependent package's actual API usage and composed build/tests.
- Add a Snyk issue ID to `.snyk` only when no usable fixed release exists; include the specific reason, creation date, and near-term expiry. Review pnpm's separate `auditConfig.ignoreGhsas` with a compatibility or availability reason and recheck date. Remove stale ignores. A Snyk ignore never resolves a pnpm audit failure.
- Do not weaken scan settings, architecture gates, or acceptance checks to silence findings.

## Unavailable stages

Retry an unchanged security or registry command with required network permission when availability is the problem. If still unavailable, preserve the exact failure, run every stage skipped by the stopped gate, and report each result. Correct missing CLI or credentials rather than repeatedly retrying the same command. Do not call skipped, unavailable, or unexecuted stages passed. Product, architecture, docs, formatting, Knip, and test failures are blockers to fix.

Snyk runs locally through `scripts/snyk-verify.mjs` with `test --all-projects --policy-path=.snyk`; never use `monitor` or `--remote-repo-url` for this gate.
