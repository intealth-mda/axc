# Behavioral and documentation evidence

- Enforce business invariants for every public application-service call, including calls that bypass transport. Transport may validate request syntax and map errors, but it must not be the only enforcement point for business rules. Test rejected operations at the layer that owns the rule and confirm they leave state unchanged.

- Test business rules at the layer that owns them, then test the composed public path. When an adapter replaces a Cellix implementation, test the reference semantics it promises, such as commit, rollback, isolation, serialization, or cloning, as applicable. Keep test depth proportional to the behavior and risk.

- Composed HTTP tests do not replace focused tests for domain transition rules, application-service invariants, or custom unit-of-work and repository semantics. For an in-memory transactional adapter, directly test successful commit, rollback after an exception, concurrent serialization or isolation, and defensive copying when those behaviors are implemented.

- Design behavior tests with inputs and expected results that distinguish a correct implementation from a plausible incorrect one. Cover meaningful boundaries and test behaviors independently when combined cases could hide a failure.

- For acceptance criteria with a required number of cases, count distinct executed test inputs and assert complete expected results. In Task Set A, A-AC11 requires two separate course-search filter combinations, including `q` + `modality` + `status`, with data that would expose an ignored predicate. A passing suite with fewer cases does not satisfy the criterion.

- When a task requires API documentation, cover every affected endpoint's request, successful response, status code, and specified error cases. Examples may be concise but must make the contract reviewable. Verify the built page renders required headings, examples, and error tables correctly; a successful docs build alone is insufficient.

Mandatory for applicable behavior changes and reviews. Record evidence in the [single run record](../../../harness-run-workflow.md#one-working-record).

- Before implementation, map every required behavior and error to its owning layer, exact reference, public contract, and planned test. For HTTP, include method/path, request validation, success response, status, and specified error code. Mark rules that hold for direct application calls. Do not invent task requirements.
- For each material rule, record an expected outcome and a plausible incorrect implementation that the test rejects. Omitting, weakening, inverting, or wrongly ordering the rule must change at least one test outcome. Use positive cases, counterexamples, boundaries, failure effects, and exact state/output assertions. Combined scenarios need independently discriminating data or focused cases. For predicates, include records satisfying the other conditions but excluded by the predicate and assert complete results or ordered IDs. Consider targeted mutation/fault injection for high-risk rules when inspection is insufficient; it is not universally required.
- For every quantified criterion, record the distinct executed inputs, complete expected results, test locations, and count against the minimum. Two assertions on one input are one case. Recount before handoff; mark any shortfall open despite a passing suite.
- For each affected HTTP endpoint, plan at least one scenario through the running application host with material success fields and specified error status/code. Inspect the acceptance feature and step-definition diff and run the focused host acceptance command. If unchanged, justify why existing scenarios cover every changed public workflow; healthcheck alone is insufficient. Focused owning-layer tests remain separate evidence.
- Audit public mutations directly, bypassing transport: invalid business inputs and boundary values must be rejected with state unchanged. Assert material response, state-transition, and audit fields rather than only counts.
- For required docs, list affected pages/sections in the record. After the gate builds docs and runs docs:check, inspect built headings, examples, and error tables against every affected endpoint. Confirm fences do not swallow headings or tables. A passing build alone does not prove rendered contract correctness.
- Reuse exported architecture checks from @cellix/archunit-tests; add application-specific checks only for uncovered boundaries. Fix architecture failures in application code; never weaken guardrails.
