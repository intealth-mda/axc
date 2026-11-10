---
name: axc-repo-map
description: AXC layout and conventions. Read once at the start of an application task.
disable-model-invocation: true
---

# axc-repo-map

In one batch, read `task-set-a-requirements.md` or `task-set-b-requirements.md`; `packages/axc-verification/acceptance-api/src/` `step-definitions/healthcheck.steps.ts` and `features/healthcheck.feature`; `packages/axc/application-services/src/health.test.ts`; `apps/api/src/index.ts`; `packages/axc/{rest,application-services,domain,persistence}/src/index.ts`; the `persistence` and `application-services` `package.json`; `apps/docs/sidebars.ts`; `apps/docs/docs/healthcheck.md`. Cellix contracts: `packages/cellix/domain-seedwork/src/domain-seedwork/{aggregate-root,domain-entity,repository,value-object,unit-of-work}.ts`, `packages/cellix/domain-seedwork/src/passport-seedwork/visa.ts`, `packages/cellix/mongoose-seedwork/src/mongoose-seedwork/mongo-repository.ts`, and `packages/cellix/archunit-tests/src/checks/{domain,application-services}-conventions.ts`. Open another file only when the spec or a Stop report names it.

Known, so do not open: each layer package has `vitest.config.ts` and `vitest.arch.config.ts`; `cucumber.yaml` loads `src/features/**/*.feature` and `src/step-definitions/**/*.steps.ts`; world and Serenity are wired. Docs: one `apps/docs/docs/<feature>.md` plus its id in `sidebars.ts`.

## House shape

Domain files live under `packages/axc/domain/src/domain/contexts/<context>/<entity>/`: `<entity>.aggregate.ts`, `<entity>.value-objects.ts`, `<entity>.repository.ts`, `index.ts`, `<entity>.aggregate.test.ts`. Add `<entity>.uow.ts` only when a command writes state. Add visa, passport, or domain-permissions only when the task needs authorization. Domain imports no `hono`, `@azure/`, `mongoose`, `mongodb`, or other `@axc/*`.

Persistence files live under `packages/axc/persistence/src/datasources` or `src/models`. The entity index exports the factories. Use `createMemoryMongoServer()` from `@axc/service-mongoose`, not `mongodb-memory-server`. If absent, persistence adds `@axc/domain` and `@axc/service-mongoose`; application services add `@axc/domain` and `@axc/persistence`. Keep `mongoose` on `@axc/service-mongoose`.

Application services live under `packages/axc/application-services/src/contexts/{context}/{entity}/`. Its `index.ts` exports `interface <E>ApplicationService` and `export const <E> = (dataSources: DataSources)`, even if unused. Do not store state in an application-service array. Services and REST import no `mongoose`, `mongodb`, or `@axc/service-mongoose`. REST does not import `@axc/persistence`.

Put routes in `packages/axc/rest/src/<feature>.routes.ts`, not `src/index.ts`. `apps/api/src/index.ts` only registers one `registerAzureFunctionHttpHandler` per route. `host.json` sets `routePrefix` empty, so the function route is the full path. Re-export from `src/index.ts` what another package imports (TS2305, TS2459, TS2724). Keep `src/index.ts` free of seed records and `.filter(`, `.sort(`, or `.slice(`.

## Types and lint

Omit an absent optional key. Narrow `arr[i]` (TS18048). An index signature uses brackets plus `// biome-ignore lint/complexity/useLiteralKeys: <reason>`. Use `import type`. An exported REST helper needs a return type (TS2883). An `async` function or test stub must `await`, else drop `async` and return `Promise.resolve(x)` or `Promise.reject(e)`.

## Tests

One scenario per criterion, titled `<ID>-AC<n>`. An unprovable criterion gets `# ac-meta: <ID>-AC<n>` in the feature. One boundary test and one negative test per validation rule. When a 400 lists several fields, assert the field set, not the order.

Copy `healthcheck.steps.ts`: static Serenity imports and the local `resolved()` cast. Name steps `src/step-definitions/<feature>.steps.ts`.

## Dependencies

Prefer a dependency already in that `package.json`. A new spec is only `workspace:*` or `catalog:`. A package with vitest may add a `test` script. Do not add vitest or touch `pnpm-lock.yaml`, `tsconfig` (Stop adds references), or vitest configs.

## Repair

Stop verifies: do not re-read a file you wrote unless an edit failed. On a block, change only the files the report names, then stop.
