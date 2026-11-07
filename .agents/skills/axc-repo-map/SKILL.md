---
name: axc-repo-map
description: AXC layout and conventions. Read once at the start of an application task.
disable-model-invocation: true
---

# axc-repo-map

Read the requirements file (`task-set-a-requirements.md` or `task-set-b-requirements.md`), then the files you will edit. Write the slice. Do not survey docs or architecture tests. Do not open `packages/cellix`, `archunit-tests`, `node_modules`, `scripts/`, skill reference trees, lockfiles, or `dist`.

## House shape

These paths are decided. Do not open `packages/axc-verification/archunit-tests`, `packages/cellix`, or `node_modules` to learn them. Build through domain, persistence, application-services, and rest.

Domain files live under `packages/axc/domain/src/domain/contexts/<context>/<entity>/`: `<entity>.aggregate.ts`, `<entity>.value-objects.ts`, `<entity>.repository.ts`, `index.ts`, `<entity>.aggregate.test.ts`. Domain imports no `hono`, `@azure/`, `mongoose`, `mongodb`, or other `@axc/*`.

Persistence files live under `packages/axc/persistence/src/datasources` or `src/models`. The entity index exports the factories. Persistence does not import application-services or rest. The in-memory server is `createMemoryMongoServer()` from `@axc/service-mongoose`. Do not import `mongodb-memory-server`. If absent, persistence adds `@axc/domain` and `@axc/service-mongoose`; application services add `@axc/domain` and `@axc/persistence`.

Application services live under `packages/axc/application-services/src/contexts/{context}/{entity}/`. The entity index exports a factory named after the folder. Do not keep stored state in an application-service array. Services and REST import no `mongoose`, `mongodb`, or `@axc/service-mongoose`. REST does not import `@axc/persistence`. REST parses the request, calls the service, and shapes the response, with a unit test beside a new handler.

`apps/api/src/index.ts` is the composition root. `host.json` sets `routePrefix` empty, so `api/courses` is `GET /api/courses`. Register one `registerAzureFunctionHttpHandler` per route. Each package's public API is `src/index.ts`. Re-export what another package imports, or the build fails with TS2305, TS2459, or TS2724. In-memory Mongo, through `@axc/persistence` and `@axc/service-mongoose`, stores catalog and enrollment state. Keep `src/index.ts` free of seed records and `.filter(`, `.sort(`, or `.slice(`.

## Types and lint

`exactOptionalPropertyTypes`: omit an absent key. `noUncheckedIndexedAccess`: narrow `arr[i]` (TS18048). `verbatimModuleSyntax`: `import type` for types. No enums. An exported REST helper needs a return type (TS2883). An `async` function with no `await` drops `async`. Export only what another file imports. On a block, do not hand-delete an unused export; the Stop hook un-exports it.

## Tests

One acceptance scenario per criterion, titled `<ID>-AC<n>`. An unprovable criterion gets `# ac-meta: <ID>-AC<n>` in the feature. For each validation rule, one boundary test and one negative test at the cheapest layer. When a 400 lists several fields, assert the field set, not the order, unless the specification orders them.

Import Serenity statically, as `healthcheck.steps.ts` does. Step text is global. Name steps `src/step-definitions/<feature>.steps.ts`. Each scenario needs its own data. Copy the local `resolved()` cast when asserting an async `Question`. Use `isGreaterThan` and `isLessThan`, not the `OrEqualTo` names.

## Dependencies

Prefer a dependency already in that `package.json`. A new spec is only `workspace:*` or `catalog:`. A `mongoose` import is `catalog:`. Do not edit `pnpm-lock.yaml`, `tsconfig`, or `vitest.config.ts`, and do not copy architecture tests.

## Repair

On a Stop block, change only the files the report names, then stop. Full verify stays on the Stop hook.
