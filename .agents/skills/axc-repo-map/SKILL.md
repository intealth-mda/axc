---
name: axc-repo-map
description: AXC layout and conventions. Read once at the start of an application task.
disable-model-invocation: true
---

# axc-repo-map

Read in this turn, then nothing else until a compiler or test error names a file:

- the task prompt's requirements file (`task-set-a-requirements.md` or `task-set-b-requirements.md`)
- `packages/axc/rest/src/index.ts`
- `apps/api/src/index.ts`
- `packages/axc/application-services/src/index.ts`
- `packages/axc-verification/acceptance-api/src/step-definitions/healthcheck.steps.ts`

Do not open `packages/cellix/**` unless you are porting a missing package. Do not open skill reference trees, lockfiles, `node_modules`, or `dist`.

## Layout

`apps/api/src/index.ts` is the composition root. `host.json` sets `routePrefix` to empty, so the function route is the full path (`api/courses` is `GET /api/courses`). Register one `registerAzureFunctionHttpHandler` per route template.

`packages/axc/domain` holds entities, value objects, and invariants. `packages/axc/persistence` holds repositories, data sources, and models. `packages/axc/service-mongoose` holds mongoose and in-memory Mongo. `packages/axc/application-services` orchestrates use cases under `src/contexts/{context}/{entity}/`. `packages/axc/rest` is Hono transport. `packages/axc-verification/acceptance-api` holds Cucumber features and steps. `packages/axc-verification/archunit-tests` is the architecture gate. Do not edit it to make a feature pass.

Each package's public API is `src/index.ts`. Re-export every type or value another package imports, or the build fails with TS2305, TS2459, or TS2724.

## Layering

Keep each `src/index.ts` a composition root: no seed records, `.filter(`, `.sort(`, or `.slice(`.

Stored catalog and enrollment state goes through `@axc/persistence` and `@axc/service-mongoose`. In-memory Mongo is the backing store. Do not keep that state in an application-service array.

Domain code imports no `hono`, `@azure/`, `mongoose`, `mongodb`, or other `@axc/*` packages. Application services and REST import no `mongoose`, `mongodb`, or `@axc/service-mongoose`. REST does not import `@axc/persistence`.

## Types and lint

`exactOptionalPropertyTypes`: omit an absent key. Do not assign `undefined`. `noUncheckedIndexedAccess`: narrow `arr[i]` before use (TS18048). `verbatimModuleSyntax`: `import type` for type-only imports (`useImportType`). No enums (`erasableSyntaxOnly`).

An exported REST helper needs an explicit return type, else TS2883. `useAwait`: an `async` function with no `await` drops `async` or gains a real await. Knip fails on unused exports and unused exported types. Export only what another file imports. Do not delete an unused export by hand during a block. The Stop hook's auto-fix un-exports it.

## Tests

One acceptance scenario per acceptance-criterion id, titled `<ID>-AC<n>`. A criterion no scenario can prove gets a `# ac-meta: <ID>-AC<n>` line in the feature.

For each validation rule, add one boundary test and one negative test at the cheapest layer that can prove it. When a 400 lists several fields, assert the field set, not the order, unless the specification orders the fields.

Import Serenity statically, as `healthcheck.steps.ts` does. Step text is global across every `.steps.ts`. A second definition of the same text is ambiguous. Name new steps `src/step-definitions/<feature>.steps.ts`. One host run shares stored state across scenarios, so each scenario needs its own data. Copy the local `resolved()` cast in `healthcheck.steps.ts` when asserting an async `Question`. `@serenity-js/assertions` has `isGreaterThan` and `isLessThan`, not the `OrEqualTo` names.

## Repair

On a Stop block, change only the files the report names. Then stop. Do not launch the checks yourself.
