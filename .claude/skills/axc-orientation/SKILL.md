---
name: axc-orientation
description: Repo map for agentCourses (axc). Read this FIRST, before any exploration — it contains what reading package.json, turbo.json, knip.json, biome.json, host.json, sidebars.ts, intro.md, healthcheck.md, the healthcheck route/service/steps, and the archunit rules would tell you. Use at the start of every task in this repo.
---

# agentCourses (axc) — orientation

Read from the repo as it stands. Still read a file before you change it.

## Layout

```
apps/api/                      composition root (Azure Functions host; routePrefix is "")
apps/docs/docs/*.md            Docusaurus docs; sidebars.ts lists doc ids: docs: ['intro', 'healthcheck']
packages/axc/domain            entities/value objects — pure (import ban in CLAUDE.md)
packages/axc/persistence       repository contracts, in-memory implementations
packages/axc/service-mongoose  mongoose/mongodb implementations only
packages/axc/application-services  use cases; ApplicationServices interface + factory
packages/axc/rest              Hono app; createRestApp(factory) + restHandlerCreator
packages/axc-verification/archunit-tests   dependency-rules.test.ts (layering)
packages/axc-verification/acceptance-api   Serenity/Cucumber against a real Functions host
packages/cellix/*              vendored framework — read, reuse, never edit
```

## How a request flows today (the healthcheck is the only route)

1. `apps/api/src/index.ts` — `Cellix.initializeInfrastructureServices(...)`
   `.setContext(() => ({ environment }))`
   `.initializeApplicationServices((ctx) => buildApplicationServicesFactory(ctx))`
   `.registerAzureFunctionHttpHandler('health', { route: 'health', methods: ['GET'], authLevel: 'anonymous' }, restHandlerCreator)`
   `.startUp()`.
   One `registerAzureFunctionHttpHandler` per route (or route pattern). `host.json`
   has `"routePrefix": ""`, so `route` is the full path after the host.
2. `packages/axc/rest/src/index.ts` — `createRestApp(applicationServicesFactory): Hono`;
   each handler does `await applicationServicesFactory.forRequest(c.req.header('Authorization'))`
   then calls a service. `restHandlerCreator` wraps it with `azureHonoHandler`.
   Query string: `c.req.query()` returns `Record<string,string>` (read keys as `query['page']`
   or destructure; `query.page` is TS4111); `c.json(body, status)`.
3. `packages/axc/application-services/src/index.ts` — `interface ApplicationServices { health: {...} }`,
   `interface ApiContext { environment }`, `buildApplicationServicesFactory(context)` returns
   `{ forRequest }`. Add a capability by extending `ApplicationServices` and the object the
   factory builds. Everything a package exposes must be reachable from its `src/index.ts`
   (knip treats `src/index.ts` as the only entry for `packages/axc/*`).

## Layering a new capability

The repo is a DDD stack and every layer is pre-wired (deps, tsconfig references,
vitest). Build a capability top-down through all of them, each piece in its own layer:

1. `packages/axc/domain` — the entity and its value objects, built on
   `@cellix/domain-seedwork`. Pure: no IO, no framework imports.
2. `packages/axc/persistence` — the repository contract for that entity plus an
   in-memory implementation. May import `@axc/domain`.
3. `packages/axc/application-services` — the use case: extend
   `ApplicationServices` and the factory object. May import `@axc/domain` and
   `@axc/persistence`.
4. `packages/axc/rest` — a thin Hono handler that only parses the request,
   calls the service, shapes the response.

House file shapes (how CellixJS codebases lay a context out — match these):

```
domain/src/domain/contexts/<context>/<entity>/
  <entity>.aggregate.ts        class extends AggregateRoot; `<Entity>Props extends
                               DomainEntityProps`; a readonly `<Entity>EntityReference` view
  <entity>.value-objects.ts    one named class per constrained value; status/kind maps as
                               `const X = {...} as const` + derived union type
  <entity>.repository.ts       interface extending the seedwork `Repository<T>` with
                               `getNewInstance(...)` and `getById(id)`
  <entity>.aggregate.test.ts   colocated; same for value-objects
  index.ts                     re-exports the folder
```

persistence implements the repository contract (in-memory here); application-services
exposes one use-case entry per capability; rest stays a parser-caller-shaper, with its
own unit test (rest is test-wired too).

## Tests

- Unit: vitest, wired in every `packages/axc/*` layer. Tests live next to the code they
  test; `health.test.ts` in application-services is the pattern.
- One owner per rule. Each acceptance criterion is proven once, by its own acceptance
  scenario (see Acceptance below).
  Unit tests cover what a scenario cannot reach cheaply: domain invariants and edge cases
  (value-object validation, state transitions) in the domain tests; in persistence,
  application-services and rest, one or two tests per module for wiring and error mapping,
  not a re-run of the criteria. Cases that differ only by data go in one `it.each` or one
  `Scenario Outline` with `Examples`.
- Acceptance: `packages/axc-verification/acceptance-api/src/features/*.feature` +
  `src/step-definitions/*.steps.ts`. `cucumber.yaml` already globs both — new files need no
  registration. Name the feature/step files after the capability under test (as `healthcheck.feature`
  is), not the entity, and keep them consistent with the doc slug you register. Copy the shape of `healthcheck.steps.ts`:
  `actorCalled('API client').attemptsTo(Send.a(GetRequest.to('/path?x=y')))`,
  `Ensure.that(resolved(LastResponse.status()), equals(200))`,
  `Question.about('…', async a => (await a.answer(LastResponse.body<T>())).field)`.
  `includes(x)` is for strings only; for an array answer use `contain(x)` or
  `containAtLeastOneItemThat(equals(x))` (all from `@serenity-js/assertions`).
  The suite boots the real Functions host on :7071 (minutes) — it is the slowest gate.
  Cover every row of the task's acceptance-criteria table (`task-set-*-requirements.md`,
  ids `A-AC1…`) with its own scenario in the capability's feature file — criteria about
  existing tests or docs included — and put the criterion id in the scenario name
  (`Scenario: A-AC8 invalid query parameters return 400`); a feature with fewer scenarios
  than criteria, or any id unnamed, is incomplete and will be sent back.
- Before the full gate (`gate_digest.py`), run these; each takes seconds:
  1. `python3 .claude/hooks/coverage_gate.py --check` — lists criteria still uncovered.
  2. `python3 .claude/hooks/cellix_check.py` — checks EVERY aggregate you created (second
     and third included) is in the contexts/<ctx>/<agg>/ shape above.
  3. `python3 .claude/hooks/knip_check.py` — names unused files/exports knip will reject.
  4. `tsgo --noEmit` in each package you changed (command in CLAUDE.md) — otherwise type
     errors surface only in the full gate.
- Architecture: `archunit-tests/src/dependency-rules.test.ts` — enforces the domain import ban in CLAUDE.md.

## Docs

`apps/docs/docs/` holds `intro.md` (`slug: /`) and `healthcheck.md` (request, response JSON,
field table, curl example). A new page needs its id added to `docs: [...]` in `sidebars.ts`.

## TypeScript flags (from `@cellix/config-typescript`)

`strict`, `exactOptionalPropertyTypes` (optional props read as `T | undefined`; assigning
`undefined` needs it in the type), `noUncheckedIndexedAccess` (`arr[i]`, `rec[k]` are
`T | undefined`), `noPropertyAccessFromIndexSignature` (index-signature keys need
`obj['k']`), `erasableSyntaxOnly` (no `enum`, `namespace`, or constructor parameter
properties), `verbatimModuleSyntax` (type-only imports need `import type`).

## Already available (no lockfile change needed)

`hono`, `@azure/functions`, `@marplex/hono-azurefunc-adapter` (rest); `vitest` via
`@cellix/config-vitest`; `@serenity-js/*`, `@cucumber/cucumber` (acceptance);
`@cellix/domain-seedwork`, `@cellix/mongoose-seedwork`, `mongodb-memory-server-core`
(service-mongoose). Cross-layer imports (`@axc/domain`, `@axc/persistence`) are already
declared where allowed.

## Harness files

`.claude/` is harness tooling. The only files there a task uses are the check scripts above.
