---
name: serenity-tests
description: >
  Write, review, or set up API acceptance tests with Serenity/JS, Cucumber,
  Screenplay, and @cellix/serenity-framework. Use for Gherkin scenarios, step
  definitions, Tasks, Interactions, Questions, Abilities, actor notes, managed
  worlds, test infrastructure, or acceptance-suite configuration.
disable-model-invocation: true
---

# Serenity Tests

Use this skill for API acceptance tests built with Serenity/JS and Cucumber.

Treat `@cellix/serenity-framework` as reusable test infrastructure. Keep
application-specific behavior, transport operations, test data, server
construction, and step definitions in the consumer project.

Before changing an acceptance suite, inspect its existing package manifest,
Cucumber configuration, world and infrastructure setup, and neighboring tests.
Preserve the project's established transport, runtime, module system, discovery
paths, and reporting conventions unless the task requires changing them.

## Core Model

- Express externally observable business behavior in `.feature` files
- Keep Cucumber step definitions thin and declarative
- Use Tasks for meaningful actor goals and Interactions for lower-level actions
- Use Abilities for capabilities an actor needs to interact with the system
- Use Questions to observe state for assertions
- Use actor notes for scenario-local context when appropriate, not as a
  substitute for observing the system under test
- Keep protocol and application details out of generic framework packages.

Do not introduce Screenplay abstractions solely for ceremony. Each Task,
Interaction, Question, or Ability should represent a useful responsibility or
remove meaningful duplication.

## Acceptance Boundary

Acceptance tests should exercise the application's real externally observable
boundary.

Do not substitute direct application-service, domain, or internal handler calls
for the boundary the scenario claims to verify.

When used with outside-in TDD, establish the failing acceptance behavior before
implementing the application behavior that satisfies it.

## AXC acceptance suite

Follow `packages/axc-verification/acceptance-api` rather than inventing a second style.

- Import Serenity statically at the top of the step file, as `healthcheck.steps.ts` does. Do not use `await import()`.
- Step patterns are global across every `.steps.ts`. Reuse an existing pattern. A second definition of the same text fails as ambiguous.
- Name new steps `src/step-definitions/<feature>.steps.ts`. Cucumber loads only the paths in `cucumber.yaml`.
- One host run shares in-memory state across scenarios. Give each scenario unique data. Do not assume an empty store.
- `@serenity-js/assertions` provides `isGreaterThan` and `isLessThan`, not `OrEqualTo` forms.
- Copy the local `resolved()` cast in `healthcheck.steps.ts` when asserting an async `Question`. `Question.about` that returns a promise is `Question<Promise<T>>`.

## References

Read only the relevant reference:

- **API acceptance setup:** `references/acceptance-api/setup.md`
- **API acceptance test writing:** `references/acceptance-api/writing-tests.md`