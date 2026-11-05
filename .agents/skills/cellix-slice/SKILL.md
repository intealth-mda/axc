---
name: cellix-slice
description: Use before adding or changing any feature in packages/axc or apps/api (new endpoint, query, command, entity, validation or error mapping). Gives the CellixJS file layout per layer, how apps/api injects data access, code skeletons, input validation rules and where each kind of test goes, so you don't need to explore /Volumes/files/src/cellixjs.
---

# Cellix vertical slice for agentCourses

Pick one bounded context name (for example `inventory`) and one entity name per aggregate, and use them in every layer. Paths below use `<context>` and `<entity>`. Follow this layout instead of flat files in `src/`. It mirrors `packages/ocom/*` in CellixJS (local checkout `/Volumes/files/src/cellixjs`, or https://github.com/CellixJs/cellixjs); open a reference file only if a decision is not covered here.

## Layout

```
packages/axc/domain/src/
  index.ts                                   export * as Domain from './domain/index.ts' (keep existing exports)
  domain/index.ts                            export * as Contexts from './contexts/index.ts'
  domain/contexts/index.ts                   export * as <Context> from './<context>/index.ts'
  domain/contexts/<context>/index.ts         export * as <Entity> from './<entity>/index.ts'
  domain/contexts/passport.ts                write side only: Passport and Visa types
  domain/contexts/<context>/<entity>/
    <entity>.entity.ts                       props and entity reference type
    <entity>.value-objects.ts                allowed values (constants) and validation rules
    <entity>.aggregate.ts                    write side only: the class extending DomainSeedwork.AggregateRoot
    <entity>.repository.ts                   write side only: repository interface
    <entity>.uow.ts                          write side only: unit-of-work interface
    features/<entity>.feature                write side only: the aggregate's rules, run by <entity>.test.ts
    index.ts                                 re-exports the above
packages/axc/persistence/src/
  index.ts                                   export type { DataSources, DataSourcesFactory } and the factory
  datasources/index.ts                       DataSources = { readonlyDataSource, domainDataSource? }
  datasources/readonly/index.ts              ReadonlyDataSource = { <Context>: { <Entity>: { <Entity>ReadRepo } } }
  datasources/readonly/<context>/index.ts
  datasources/readonly/<context>/<entity>/<entity>.read-repository.ts   interface + in-memory implementation
  datasources/domain/<context>/<entity>/     write side, in memory: <entity>.repository.ts and <entity>.uow.ts
  seed/<context>/<entity>.ts                 seed or fixture records (not *.data.ts: CellixJS uses that name for Mongo data sources)
packages/axc/application-services/src/
  index.ts                                   ApplicationServices = { <Context>: <Context>ContextApplicationService, health }
  contexts/<context>/index.ts                <Context>(dataSources) composes entity services
  contexts/<context>/<entity>/index.ts       <Entity>ApplicationService interface + <Entity>(dataSources)
  contexts/<context>/<entity>/<operation>.ts one file per use case (query-by-x.ts, create.ts, update.ts)
  contexts/<context>/<entity>/features/<operation>.feature   one per use case file
packages/axc/rest/src/
  index.ts                                   createRestApp only registers routes; keep /health as is
  features/<resource>.ts                     one module per resource: parsing, validation, error mapping
```

## Composition: apps/api injects, nothing else constructs

```ts
// apps/api/src/index.ts: build the data sources once and pass them through the context
.setContext(() => ({ environment: RuntimeConfig.environment, dataSourcesFactory: Persistence() }))

// application-services/src/index.ts
export interface ApiContext { environment: HealthEnvironment; dataSourcesFactory: DataSourcesFactory }
const forRequest = async () => {
	const dataSources = context.dataSourcesFactory.withSystemPassport();
	return { health: ..., Inventory: Inventory(dataSources) };
};

// contexts/<context>/<entity>/index.ts
export interface ItemApplicationService { queryItems: (query: ItemSearchQuery) => Promise<ItemSearchResult> }
export const Item = (dataSources: DataSources): ItemApplicationService => ({ queryItems: queryItems(dataSources) });

// contexts/<context>/<entity>/query-items.ts: curried, DataSources first
export const queryItems = (dataSources: DataSources) => async (query: ItemSearchQuery) =>
	dataSources.readonlyDataSource.Inventory.Item.ItemReadRepo.search(query);
```

Rules:
- Application services import persistence **types** only (`import type { DataSources } from '@axc/persistence'`). Only `apps/api` imports persistence implementations.
- Context `index.ts` imports entity APIs with an alias and their explicit type: `import { Item as ItemApi, type ItemApplicationService } from './item/index.ts'`.
- Queries read through `readonlyDataSource`. Commands load the aggregate through the unit of work (`withScopedTransaction`), call a domain method, and save.
- Business rules (allowed values, invariants such as uniqueness, allowed state changes) live in the domain entity or the application service, not only in REST, and must hold when the service is called directly.

## Write side (commands)

The shared CellixJS checks read these files as text, so copy these shapes (`Item` stands for your entity). The `DomainSeedwork.` prefix matches CellixJS; the seedwork only has subpath exports.

```ts
// domain/contexts/passport.ts: axc has no identity or permissions yet, so no permission checks
export type Visa = Readonly<Record<string, never>>;
export interface Passport { readonly visa: Visa }

// item.entity.ts
import type { DomainEntityProps } from '@cellix/domain-seedwork/domain-entity';
export interface ItemProps extends DomainEntityProps { name: string }
export type ItemEntityReference = Readonly<ItemProps>;

// item.aggregate.ts
import * as DomainSeedwork from '@cellix/domain-seedwork/aggregate-root';
import type { Passport, Visa } from '../../passport.ts';
import type { ItemProps } from './item.entity.ts';
export class Item<P extends ItemProps> extends DomainSeedwork.AggregateRoot<P, Passport> {
	static getNewInstance<P extends ItemProps>(newProps: P, passport: Passport, name: string): Item<P> {
		const item = new Item(newProps, passport);
		item.props.name = name; // validate first and throw a domain error when a rule is broken
		return item;
	}
	protected get visa(): Visa {
		return this.passport.visa;
	}
}

// item.repository.ts: interfaces only. Repository<T> already declares get(id) and save(item).
import type * as DomainSeedwork from '@cellix/domain-seedwork/repository';
import type { Item } from './item.aggregate.ts';
import type { ItemProps } from './item.entity.ts';
export interface ItemRepository<P extends ItemProps> extends DomainSeedwork.Repository<Item<P>> {
	getNewInstance(name: string): Promise<Item<P>>;
}

// item.uow.ts: interfaces only
import type * as DomainSeedwork from '@cellix/domain-seedwork/unit-of-work';
import type { Passport } from '../../passport.ts';
import type { Item } from './item.aggregate.ts';
import type { ItemProps } from './item.entity.ts';
import type { ItemRepository } from './item.repository.ts';
export interface ItemUnitOfWork<P extends ItemProps> extends DomainSeedwork.UnitOfWork<Passport, P, Item<P>, ItemRepository<P>>, DomainSeedwork.InitializedUnitOfWork<Passport, P, Item<P>, ItemRepository<P>> {}
```

- Change state through aggregate methods that enforce the rule and throw a domain error when it is broken (for example an invalid transition).
- Throw `NotFoundError` from `@cellix/domain-seedwork/repository` for a missing id. Persistence holds a system passport (`{ visa: {} }`) and implements the repository and unit of work.
- Storage is in memory: the base API has no database, so do not add MongoDB or Mongoose. In-memory implementations live in `persistence/src/datasources/domain/<context>/<entity>/`. Copy objects on read and write so callers can't mutate stored state, and keep the store per process.
- `withScopedTransaction` works on copies and commits only when the callback resolves, so a thrown domain error leaves the store unchanged. Run transactions one at a time so a check-then-save rule can't race.

## Validation and error contract (REST boundary)

- Parse every query or body field explicitly and collect all problems into `details: [{ field, message }]` before answering 400.
- Enumerated values come from the domain constants, never retyped lists.
- Integers: digits only, then `Number.isSafeInteger`, then the range check. Huge values like `page=99999999999999999999` must be 400, not `Infinity` or `null`.
- A parameter that is present but empty (`?filter=`) is not the same as absent. Either reject it with 400 or handle it on purpose, and test it.
- Map domain errors to the HTTP status and error code the task specifies, in one place per resource. Response bodies use the exact field names from the task.

## Tests

| Layer | Where | What |
| --- | --- | --- |
| Domain | `domain/src/domain/contexts/<context>/<entity>/*.test.ts` | rules and state transitions, including rejected ones |
| Persistence | next to the repository | filtering, paging and sorting, copy-on-read, and on the write side that a thrown error inside a transaction leaves the store unchanged |
| Application services | next to the operation | use cases called directly, including broken rules leaving state unchanged |
| REST | `rest/src/features/<resource>.test.ts` with `app.request(...)` | validation, status codes, error bodies |
| Acceptance | `axc-verification/acceptance-api/src/features/<capability>.feature` | one scenario per acceptance criterion, criterion id in the name (`Scenario: <criterion-id> <what it proves>`), over HTTP through the real host |

- Each `features/<name>.feature` (next to every aggregate and every application-service operation) is run by the sibling `<name>.test.ts` with `@amiceli/vitest-cucumber`: add `"@amiceli/vitest-cucumber": "catalog:"` to that package's devDependencies. Step text must match the feature line exactly, and a scenario without code fails the test. Application-service tests pass a stub `DataSources`, as CellixJS does. REST and persistence tests stay plain Vitest.

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describeFeature, loadFeature } from '@amiceli/vitest-cucumber';
import { expect } from 'vitest';

const feature = await loadFeature(path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'features/create.feature'));

describeFeature(feature, ({ Scenario }) => {
	Scenario('Creating an item saves it once', ({ Given, When, Then }) => {
		const saved: string[] = [];
		Given('an empty item store', () => {
			// build a stub DataSources whose unit of work pushes saved items into `saved`
		});
		When('an item named "Widget" is created', async () => {
			// await create(dataSources)('Widget');
		});
		Then('the store holds 1 item', () => {
			expect(saved).toEqual(['Widget']);
		});
	});
});
```

- Assert concrete results: expected ids, counts or field values. A check like `every item matches` passes on an empty list, so also assert that the list isn't empty.
- A package without Vitest copies the setup from `application-services` (`vitest.config.ts`, `tsconfig.vitest.json`, `test` script, `vitest` / `@vitest/coverage-istanbul` / `@cellix/config-vitest` dev dependencies). Domain tests must not import infrastructure, because the architecture test scans them.

## Enforced by test:arch (Stop hook)

These fail the gate, so build them in from the start:
- Domain write side: the shapes above. The aggregate lives in `<entity>.aggregate.ts`, has `static getNewInstance` and imports `Passport, Visa` from `passport.ts` and its `.entity.ts`. The repository and unit of work export interfaces only, and the unit of work imports Passport, the `.entity.ts` and the `.repository.ts`. Siblings `<entity>.repository.ts`, `<entity>.uow.ts` and `features/<entity>.feature` are required.
- Persistence: every `<entity>.uow.ts` under `datasources/domain` has a sibling `<entity>.repository.ts`, and files under `datasources/readonly` never call write methods (`create`, `save`, `insertMany`, `updateOne`, `deleteOne` and similar).
- Application services: every file under `contexts/` except `index.ts` is an operation `export const op = (dataSources: DataSources) => async (input) => ...` with its own `features/<op>.feature`, so keep helpers out of `contexts/`. Files named `query-*`, `get-*` or `find-*` read through `readonlyDataSource`; files named `create.ts`, `update.ts` or `delete.ts` call `withScopedTransaction`. Each entity `index.ts` exports an `interface <Entity>ApplicationService`.
- Feature files: each scenario has a When and a Then, one When per scenario, unique titles; parameterise a `Then` instead of reusing the same unparameterised one.
- Layers: domain imports no other axc package; application services import persistence types only and never rest; rest never imports persistence; `apps/api` imports packages by name, never `.../src/...`.
- Every docs page is in `sidebars.ts` and every sidebar id resolves.

## Docs

- One page per resource in `apps/docs/docs/`: path, parameters or body, success response, every error case with status and code. Add its id to `apps/docs/sidebars.ts`; ids must match file names.
- When you make an architectural choice the task doesn't dictate, add a decision record. Storage is always one: state that data is kept in memory and cite the requirement or constraint that allows it. Write each one as `apps/docs/docs/decisions/NNNN-<title>.md` in the CellixJS MADR short format: front matter `id: NNNN-<title>`, `status: accepted` and `date`, then the sections Context and Problem Statement, Considered Options, Decision Outcome, Consequences. Docusaurus drops a leading `NNNN-` from doc ids unless `id` is set, so always set it and list the page in the sidebar as `decisions/NNNN-<title>`.
- Keep one traceability page, `apps/docs/docs/traceability.md` (front matter `id: traceability`, listed in the sidebar): a table per task mapping each requirement and acceptance criterion id to the test file and test or scenario name that proves it. Add a section to it instead of creating a second page.
