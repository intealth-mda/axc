# Harness usage

Harness operating notes live here because the repository README is protected. Use the [run workflow](harness-run-workflow.md) and [security policy](verification-policy.md) for mandatory procedures.

## Full verification gate

`pnpm run verify` runs, in order:

1. Dependency script policy (`ignore-scripts=true`)
2. Biome
3. Typecheck and build
4. Rendered API documentation checks
5. Knip
6. `@e18e/cli analyze`
7. Architecture tests
8. Unit tests and Serenity acceptance tests
9. `pnpm run audit` (currently high threshold; the security policy additionally requires all-severity JSON evidence)
10. Snyk local CLI

Snyk does not call `snyk monitor` and does not pass `--remote-repo-url`. The organization slug is `agentcourses`. Missing CLI or credentials fail verification and must be reported as unavailable. A successful authenticated `snyk test` still fails the gate when Snyk reports vulnerabilities.

## Agent verification output

`node scripts/verify-quiet.mjs` runs the same full `pnpm run verify` gate, saves complete stdout/stderr in ignored `.agents-work/verification/run-*/verify.log`, and prints its exit/signal and log location. Open the log for diagnostics and individual stage results; a stopped gate leaves subsequent stages unexecuted. The wrapper does not convert unavailable scans into passes. See the [harness workflow](harness-run-workflow.md) and [security policy](verification-policy.md).

For focused acceptance output after building prerequisites, run from `packages/axc-verification/acceptance-api`:

```sh
NODE_ENV=test pnpm exec cucumber-js --profile default --profile agent
pnpm exec serenity-bdd run --source target/site/serenity --destination target/site/serenity --features src/features
```

The agent profile uses Cellix's public `@cellix/serenity-framework/formatters/agent` export. Default JSON, HTML, and Serenity evidence remain enabled. Run the report command even when inspecting a failed acceptance run; formatter console diagnostics are condensed, while the report artifacts retain detailed evidence. This focused command supplements the full gate.

For a controlled comparison, use the evaluation-only [comparison guidance](evaluation-comparison.md) and the existing [evaluation form](../evaluation-run-record.md). File-size changes alone are not token or cost savings.
