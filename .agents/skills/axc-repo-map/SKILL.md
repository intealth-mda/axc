---
name: axc-repo-map
description: AXC layout and conventions.
disable-model-invocation: true
---

In one batch, read `task-set-a-requirements.md` or `task-set-b-requirements.md`; `packages/axc-verification/acceptance-api/src/` `step-definitions/healthcheck.steps.ts` and `features/healthcheck.feature`; `packages/axc/application-services/src/health.test.ts`; `apps/api/src/index.ts`; `packages/axc/{rest,application-services,domain,persistence}/src/index.ts`; `persistence` and `application-services` `package.json`; `apps/docs/sidebars.ts`; `apps/docs/docs/healthcheck.md`; the Cellix contracts `packages/cellix/domain-seedwork/src/domain-seedwork/{aggregate-root,domain-entity,repository,value-object,unit-of-work}.ts`, `packages/cellix/domain-seedwork/src/passport-seedwork/visa.ts` and `packages/cellix/archunit-tests/src/checks/{domain,application-services}-conventions.ts`. Open nothing else unless the spec or a Stop report names it.

Known, so do not open: layer packages have `tsconfig.json` (Stop adds references), `vitest.config.ts` and `vitest.arch.config.ts`; `cucumber.yaml` loads `src/features/**/*.feature` and `src/step-definitions/**/*.steps.ts`. Docs: add `<feature>.md` and its `sidebars.ts` id. Before Stop, ignore LSP errors from new imports, including missing inherited members: Stop installs and builds.

## House shape

Domain files go in `packages/axc/domain/src/domain/contexts/<context>/<entity>/`: `<entity>.{entity,aggregate,value-objects,repository,aggregate.test}.ts` and `index.ts`. Add `<entity>.uow.ts` only when a command writes state. Domain imports no `hono`, `@azure/`, `mongoose`, `mongodb` or other `@axc/*`.

Every aggregate imports its entity props, a `<C>Passport` from `contexts/<context>/<context>.passport.ts` and a Visa (seedwork `Visa`, or `<context>.visa.ts` plus `<context>.domain-permissions.ts` when the task authorizes writes). No root export or local namespace: `import * as DomainSeedwork from '@cellix/domain-seedwork/aggregate-root'`, then `extends DomainSeedwork.AggregateRoot<Props, <C>Passport>`. Repositories and UoWs use `import type * as DomainSeedwork` from `/repository` or `/unit-of-work`.

Persistence lives in `packages/axc/persistence/src/datasources` or `src/models`. A memory Mongo uses `createMemoryMongoServer()` from `@axc/service-mongoose`, never `mongodb-memory-server`; keep `mongoose` there. Persistence depends on `@axc/domain`; application services on `@axc/domain` and `@axc/persistence`.

Application services live under `packages/axc/application-services/src/contexts/{context}/{entity}/`. Its `index.ts` exports `interface <E>ApplicationService` and `export const <E> = (dataSources: DataSources)`. Do not store state in an application-service array. Services and REST import no `mongoose`, `mongodb` or `@axc/service-mongoose`; REST no `@axc/persistence`.

Routes go in `packages/axc/rest/src/<feature>.routes.ts`, not `src/index.ts`. `apps/api/src/index.ts` registers one `registerAzureFunctionHttpHandler` per route. `host.json` `routePrefix` is empty: routes are full paths. Keep `src/index.ts` free of seed records and `.filter(`, `.sort(` or `.slice(`.

## Types, lint, tests

`exactOptionalPropertyTypes` is on (TS2375, TS2379): declare `k?: T`, never `T | undefined` or `X['k']` of an optional `k`; omit an absent key. Narrow `arr[i]` (TS18048). An exported REST helper needs a return type (TS2883). Every `async` function or callback (stub, step, `Question.about`) must `await`, else drop `async` and return `Promise.resolve(x)` or `Promise.reject(e)`. Index-signature keys use brackets plus `// biome-ignore lint/complexity/useLiteralKeys: <reason>`.

One scenario per criterion, titled `<ID>-AC<n>`. An unprovable criterion gets `# ac-meta: <ID>-AC<n>`. One boundary and one negative test per validation rule. When a 400 lists several fields, assert the field set, not the order.

Copy `healthcheck.steps.ts`: static Serenity imports and the local `resolved()` cast.

## Dependencies and repair

A new spec is only `workspace:*` or `catalog:`. Do not add vitest or touch `pnpm-lock.yaml` or configs. Make all writes in one response; do not re-read a file you wrote unless an edit failed. On a block, change only the files the report names, then stop.
