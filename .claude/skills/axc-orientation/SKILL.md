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
packages/axc/domain            entities/value objects — pure (import ban in AGENTS.md)
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
   Query string: `c.req.query()` returns `Record<string,string>`. Pass the whole record to
   the service and destructure it there (`const { page, sort = 'title' } = query`).
   `query.page` is TS4111 and `query['page']` trips biome `useLiteralKeys`. Destructured
   keys are `string | undefined`, so a type that receives them declares
   `page?: string | undefined` (`exactOptionalPropertyTypes`), or TS2345 follows.
   Respond with `c.json(body, status)`.
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
  <entity>.aggregate.ts        class extends AggregateRoot<Props, undefined> (no passport
                               until auth exists); `<Entity>Props extends
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

## Cross-layer decisions (house defaults; the task's spec wins where it says otherwise)

- **Errors.** Value objects and aggregates throw named `Error` subclasses. The capability's
  service module catches them and throws one `ServiceError(code, message, details)`, where
  `code` is a string-literal union. rest maps code to status once (`Record<Code, 400 | 404 | 409>`)
  in `app.onError` and returns `{ error: { code, message, details } }`. A body that is not
  valid JSON goes through the same path as a 400. Define `ServiceError` once in
  application-services and export it; later capabilities add codes to it.
- **Ids and time.** The service creates them (`randomUUID()` from `node:crypto`,
  `new Date().toISOString()`) and passes them in: `getNewInstance(id, input, now)`,
  `changeX(…, now)`. The domain never reads a clock or a random source, so its tests are
  deterministic.
- **Typed domain.** `unknown` stops at the service. Each use case takes a typed command
  (`interface ChangeXCommand { readonly status: string; … }`, as CellixJS does); the service
  narrows the request body to it field by field (`typeof v === 'string'`, else
  `ServiceError('INVALID_REQUEST', …, [{ field, message }])`) and narrows a status string with
  the value-objects type guard. Domain constructors, factories, methods and value objects take
  only typed values (`string`, a value-object class, the status union): no `unknown` or `any`
  anywhere in domain source.
- **Unit of work.** A use case that reads and then writes (a status change, a create guarded by
  a uniqueness rule) does its read, check and save inside one transaction of
  `InMemoryUnitOfWork` from `@axc/persistence` (pre-built; same contract as CellixJS's Mongo
  unit of work). Build it once beside its repository: `const uow = new InMemoryUnitOfWork(repo)`.
  Transactions run one at a time, so two requests cannot both pass the same check:
  `await uow.withScopedTransaction(async (repo) => { const x = await repo.get(id); x.changeX(…); saved = await repo.save(x); })`.
  Reads that do not write use the repository directly.
- **Repository lifetime.** Build in-memory repositories once in
  `buildApplicationServicesFactory`, outside `forRequest`, so state survives across requests.
  Seed data lives in the in-memory repository.
- **One capability, one module per layer** (when the task adds a capability).
  application-services gets `<capability>.ts` (use cases) and one key on `ApplicationServices`.
  rest gets one route line per endpoint. Create returns 201.
- **Write order** (when the task adds a capability; a fix or refactor touches only the layers
  it needs). Batch 1 is domain and persistence. Batch 2 is application-services, rest,
  acceptance and docs. Write each batch's tests in the same batch, then run the precheck
  once (Tests below). Plan only the batch you are about to write: before batch 1, settle
  what domain and persistence hold (fields, value objects, invariants, transitions, errors,
  repository methods), across every capability, and write it. Design batch 2 in the next
  turn, against the batch-1 code then in context.

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
  is), not the entity, and keep them consistent with the doc slug you register. Steps follow
  this shape (healthcheck.steps.ts plus a typed body reader; it typechecks as written and the
  precheck's biome `--write` formats it — rename the placeholder `Thing`, paths and phrases):
  ```ts
  import { Given, Then, When } from '@cucumber/cucumber';
  import { contain, Ensure, equals } from '@serenity-js/assertions';
  import { type Answerable, actorCalled, Question } from '@serenity-js/core';
  import { GetRequest, LastResponse, PatchRequest, PostRequest, Send } from '@serenity-js/rest';
  // QuestionAdapter is typed as Question<Promise<T>>. The actor resolves it to T.
  const resolved = <T>(answerable: Answerable<Promise<T>>): Answerable<T> => answerable as unknown as Answerable<T>;
  interface Thing { id: string; name: string; items: { id: string; label: string }[] }
  interface ErrorBody { error: { code: string; details: { field: string }[] } }
  const actor = () => actorCalled('API client');
  const body = <B, R>(pick: (b: B) => R) =>
  	resolved(Question.about('the response body', async (a) => pick(await a.answer(LastResponse.body<B>()))));
  let lastId = '';
  Given('a thing named {string} exists', async (name: string) => {
  	await actor().attemptsTo(Send.a(PostRequest.to('/api/things').with({ name })));
  	lastId = (await actor().answer(LastResponse.body<Thing>())).id;
  });
  When('the client looks up that thing', () => actor().attemptsTo(Send.a(GetRequest.to(`/api/things/${lastId}`))));
  When('the client submits a thing:', (json: string) =>
  	actor().attemptsTo(Send.a(PostRequest.to('/api/things').with(JSON.parse(json)))));
  When('the client relabels that thing with:', (json: string) =>
  	actor().attemptsTo(Send.a(PatchRequest.to(`/api/things/${lastId}/label`).with(JSON.parse(json)))));
  Then('the response status is {int}', (status: number) => actor().attemptsTo(Ensure.that(resolved(LastResponse.status()), equals(status))));
  Then('the error code is {string}', (code: string) => actor().attemptsTo(Ensure.that(body((b: ErrorBody) => b.error.code), equals(code))));
  Then('the error names field {string}', (field: string) =>
  	actor().attemptsTo(Ensure.that(body((b: ErrorBody) => b.error.details.map((d) => d.field)), contain(field))));
  Then('the last item is {string} labelled {string}', (id: string, label: string) =>
  	actor().attemptsTo(Ensure.that(body((b: Thing) => `${b.items.at(-1)?.id}:${b.items.at(-1)?.label}`), equals(`${id}:${label}`))));
  ```
  None of these example steps exists in the repo (`healthcheck.steps.ts` defines only its own three).
  Step definitions are global across files, so write every step your feature uses into the
  capability's steps file, each phrase exactly once.
  Step phrases name the business action, as `healthcheck.feature` does (`When the client requests
  the healthcheck`): no HTTP verbs or paths in the feature file; the path lives in the step.
  Each assertion picks a primitive, a `string[]` or a joined string out of a typed body and
  compares it with `equals`/`contain`. Never compare `JSON.stringify` of an object (key order
  is not part of the contract), and never type a body as `Record<string, …>` (`b.id` is then
  TS4111 and `b['id']` trips biome `useLiteralKeys`): declare the fields you read. A JSON
  request body goes in a doc string (`… with:` then a `"""` block); a `{string}` cannot hold
  its quotes. An invalid-JSON case sends the raw text:
  `.with('{bad').using({ headers: { 'Content-Type': 'application/json' } })`.
  Every `Question` passed to `Ensure.that` needs `resolved(...)`, or tsgo reports TS2345.
  `@serenity-js/assertions` exports exactly: `and`, `contain`, `containAtLeastOneItemThat`,
  `containItemsWhereEachItem`, `endsWith`, `equals`, `includes`, `isAfter`, `isBefore`,
  `isCloseTo`, `isFalse`, `isGreaterThan`, `isLessThan`, `isPresent`, `isTrue`, `matches`,
  `not`, `or`, `property`, `startsWith`. There is no `…OrEqualTo`: use
  `not(isGreaterThan(x))`. `includes(x)` is for strings only; for an array answer use
  `contain(x)` or `containAtLeastOneItemThat(equals(x))`.
  The suite boots the real Functions host on :7071 (minutes) — it is the slowest gate.
  The task's requirements file is `task-set-<x>-requirements.md` at the repo root. Cover every
  row of its acceptance-criteria table (ids `<X>-AC<n>`) with its own scenario in the
  capability's feature file, and put the criterion id in the scenario name
  (`Scenario: A-AC8 invalid query parameters return 400`); a feature with fewer scenarios
  than criteria, or any id unnamed, is incomplete and will be sent back. A criterion HTTP
  cannot observe directly (existing tests pass, docs complete) still gets its scenario: assert
  what the suite can see (the healthcheck still answers, the doc page lists each endpoint
  and error code).
  Data rules outside the table bind too and get a scenario each: seed or fixture size and mix,
  including those of a task set this one builds on (Task B reuses Task A's Course model and
  search, so its seed keeps Task A's rule: at least 12 courses mixing modalities, statuses and
  tags). Name the rule in the scenario (`Scenario: seed has 12+ courses of mixed modality, status and tags`).
- Self-check: end the call that writes your last files with
  `python3 .claude/hooks/precheck.py && python3 .claude/hooks/gate_digest.py`: the full gate
  starts only on a clean precheck, so a clean first pass needs no extra turn. Use the same chain
  after fixes. The precheck runs biome `--write` on changed files, typecheck and unit tests of
  every changed package (acceptance-api included), then the six checks below, and prints
  only problems, ending `precheck OK` or `precheck FAIL: <steps>`.
  Run biome `--write` before patching a file with sed or python: reformatting moves the text
  a later patch would match. The checks enforce these rules, so code to them:
  - coverage: every criterion id of the task's table is named in a capability `.feature`
    (not `healthcheck.feature`), and there are at least as many scenarios as criteria.
  - cellix: every layer (domain, persistence, application-services, rest) changed; each
    aggregate under `domain/src/domain/contexts/<ctx>/<agg>/` has the five files above; no
    domain file directly in `domain/src/` except `index.ts`; every changed `src/*.ts` with
    runtime code has a colocated `<name>.test.ts` (exempt: `index.ts`, `*.d.ts`, files whose
    name contains `seed` or `fixture`, type-only files); at least one rest `src/*.test.ts`;
    no `unknown`/`any` in domain source (tests exempt); every application-services module
    that calls `.save(` also calls `withScopedTransaction`.
  - knip: every new file and export is reachable from its package's `src/index.ts` and used.
  - tests: tests that existed before the task stay intact: none deleted, none with fewer test
    cases or assertions (adding tests, renaming a scenario, editing imports is fine).
  - spec: every key of the requirements file's example JSON (request, response, error bodies)
    appears in the changed source, tests and docs excluded: use the spec's field names exactly.
  - mdx: changed `apps/docs` pages have no `{…}` or `<tag>` outside code (see Docs).
- Architecture: `archunit-tests/src/dependency-rules.test.ts` — enforces the domain import ban in AGENTS.md.

## Docs

`apps/docs/docs/` holds `intro.md` (`slug: /`) and `healthcheck.md` (request, response JSON,
field table, curl example). A new page needs its id added to `docs: [...]` in `sidebars.ts`.
Pages are MDX: `{id}` or `<tag>` in prose, headings or tables is parsed as JSX and fails the
docs build. Put paths and placeholders in backticks (`` `GET /things/{id}` ``) or write `:id`.
If a requirements file names a docs path outside the task's write boundary (a root `docs/`
folder, say), the boundary wins: write the page under `apps/docs/docs/` and say so in the
summary.

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

`@cellix/domain-seedwork` is imported by subpath (there is no root export):

| import | what you get |
| --- | --- |
| `@cellix/domain-seedwork/aggregate-root` | `abstract class AggregateRoot<Props extends DomainEntityProps, Passport>`; constructor `(props, passport)`; `addDomainEvent(EventClass, payload)` |
| `@cellix/domain-seedwork/domain-entity` | `interface DomainEntityProps { readonly id: string }`; entities expose `.id` and `.props` |
| `@cellix/domain-seedwork/repository` | `interface Repository<T> { get(id: string): Promise<T>; save(item: T): Promise<T> }`; `class NotFoundError` |
| `@cellix/domain-seedwork/value-object` | `abstract class ValueObject<Props>`; constructor `(props)`; `props` is protected |
| `@cellix/domain-seedwork/unit-of-work` | `UnitOfWork` / `InitializedUnitOfWork` contracts; `@axc/persistence` exports `InMemoryUnitOfWork(repo)` implementing them (`withScopedTransaction(fn)`, `withScopedTransactionById(id, fn)`) |

## Harness files

`.claude/` holds the harness. Use it through the commands in this map; the rules its checks
enforce are listed under Tests.
