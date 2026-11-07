---
name: axc-repo-map
description: AXC layout and conventions. Read once at the start of an application task.
disable-model-invocation: true
---

# axc-repo-map

Read the requirements file (`task-set-a-requirements.md` or `task-set-b-requirements.md`), then only `healthcheck.steps.ts`, `packages/axc/application-services/src/health.test.ts`, `apps/api/src/index.ts`, `packages/axc/rest/src/index.ts`, and `packages/axc/application-services/src/index.ts`. Framework contracts, and no other `packages/cellix` file: `packages/cellix/domain-seedwork/src/domain-seedwork/` `aggregate-root.ts`, `domain-entity.ts`, `repository.ts`, `value-object.ts`, `unit-of-work.ts`, and `packages/cellix/mongoose-seedwork/src/mongoose-seedwork/mongo-repository.ts`. Do not open `archunit-tests`, `node_modules`, `scripts/`, skill reference trees, lockfiles, `dist`, or `/Volumes/files/src/cellixjs`. Open another file only when the task spec or a Stop report names it.

## House shape

Domain files live under `packages/axc/domain/src/domain/contexts/<context>/<entity>/`: `<entity>.aggregate.ts`, `<entity>.value-objects.ts`, `<entity>.repository.ts`, `index.ts`, `<entity>.aggregate.test.ts`. Domain imports no `hono`, `@azure/`, `mongoose`, `mongodb`, or other `@axc/*`.

Persistence files live under `packages/axc/persistence/src/datasources` or `src/models`. The entity index exports the factories. The in-memory server is `createMemoryMongoServer()` from `@axc/service-mongoose`. Do not import `mongodb-memory-server`. If absent, persistence adds `@axc/domain` and `@axc/service-mongoose`; application services add `@axc/domain` and `@axc/persistence`. A `mongoose` import is `catalog:`.

Application services live under `packages/axc/application-services/src/contexts/{context}/{entity}/`. The entity index exports a factory named after the folder. Do not keep stored state in an application-service array. Services and REST import no `mongoose`, `mongodb`, or `@axc/service-mongoose`. REST does not import `@axc/persistence`. REST parses the request, calls the service, and shapes the response. A unit test belongs in a package that already has a `test` script.

`apps/api/src/index.ts` registers one `registerAzureFunctionHttpHandler` per route. `host.json` sets `routePrefix` empty, so the function route is the full path. Re-export from `src/index.ts` what another package imports (TS2305, TS2459, TS2724). Keep `src/index.ts` free of seed records and `.filter(`, `.sort(`, or `.slice(`.

## Types and lint

Omit an absent optional key. Narrow `arr[i]` (TS18048). An index signature uses brackets plus `// biome-ignore lint/complexity/useLiteralKeys: <reason>`. Use `import type`. An exported REST helper needs a return type (TS2883). Drop `async` with no `await`. Export only what another file imports. The Stop hook un-exports an unused export.

## Tests

One scenario per criterion, titled `<ID>-AC<n>`. An unprovable criterion gets `# ac-meta: <ID>-AC<n>` in the feature. One boundary test and one negative test per validation rule. When a 400 lists several fields, assert the field set, not the order.

Import Serenity statically, as `healthcheck.steps.ts` does. Name steps `src/step-definitions/<feature>.steps.ts`. Copy the local `resolved()` cast. Use `isGreaterThan` and `isLessThan`.

## Dependencies

Prefer a dependency already in that `package.json`. A new spec is only `workspace:*` or `catalog:`. Do not add a `test` script or a `vitest` dependency to a package that does not already have them. Do not edit `pnpm-lock.yaml`, `tsconfig`, or `vitest.config.ts`, and do not copy architecture tests.

## Repair

On a Stop block, change only the files the report names, then stop. Full verify stays on the Stop hook.
