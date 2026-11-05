---
name: cellix-architecture
description: >
  Development workflow for agentCourses Cellix features. Use when adding or changing
  domain, application service, persistence, mongoose model, GraphQL, or REST code.
  Requires @cellix/generator for new features, @cellix/lint for file body, visibility,
  and dependency-graph checks, and the agentAccess write hook.
---

# Cellix development

Generate a new context, subdomain, or action. Edit a file that already exists. Do not invent a second layout.

`factory.json` at the project root holds `enabled` and the layer paths. The generator reads it and writes into those paths. Do not edit that file.

## Commands

A new REST read is two commands, in this order. Do not run `--help`.

1. `generate` builds the subdomain: domain, model, and persistence. Pass every `--field` here. No `--action`. No `--transport`. It does not add a route.
2. `query` adds the read onto that subdomain. Pass `--name`, `--param`, `--route`, and `--transport rest`. No `--field`. It writes the repository method, the application service, and `GET /api/<route>`.

```bash
pnpm --filter @cellix/generator generate -- --context <context> --subdomain <subdomain> --field <field>:<type>
pnpm --filter @cellix/generator query -- --context <context> --subdomain <subdomain> --name <name> --param <param>:<type> --route <route> --transport rest
```

The repository method rejects with `not implemented`. Fill that method in. The result is `EntityReference[]`. Leave that array as it is in domain, persistence, and the application service. Shape the HTTP body in the REST index.

A new GraphQL read is the same two commands. No `--route`. The field name is `--name`.

1. `generate` is the same subdomain command. Pass every `--field`. No `--action`. No `--transport`.
2. `query` adds the query field. Pass `--name`, `--param`, and `--transport graphql`. No `--field`. No `--route`.

```bash
pnpm --filter @cellix/generator generate -- --context <context> --subdomain <subdomain> --field <field>:<type>
pnpm --filter @cellix/generator query -- --context <context> --subdomain <subdomain> --name <name> --param <param>:<type> --transport graphql
```

That `query` writes the resolver when the file does not exist yet. A later GraphQL query adds another query field.

A mutation is `generate` with `--action`. Add `--transport graphql` on that command when the mutation should have a resolver. Leave it off and there is no resolver. A later `generate --action` with a different action adds that action onto the subdomain that already exists. A REST create passes `--route` and `--transport rest` on that same command. It writes the route. `update` loads with `getById` inside `withScopedTransaction`. Fill in the assignment above `save`. A REST update requires `--route`. Pass `--method patch` when the write is not POST. A GraphQL update does not take a route. The field name is `--name`. The generator creates the slice directories. That is the layout.

```bash
pnpm --filter @cellix/generator generate -- --context <context> --subdomain <subdomain> --action <action> --field <field>:<type> --route <route> --transport rest
pnpm --filter @cellix/generator generate -- --context <context> --subdomain <subdomain> --action <action> --field <field>:<type> --transport graphql
pnpm --filter @cellix/generator mutation -- --context <context> --subdomain <subdomain> --name <name> --param <param>:<type> --route <route> --method patch --transport rest
pnpm --filter @cellix/generator mutation -- --context <context> --subdomain <subdomain> --name <name> --param <param>:<type> --transport graphql
pnpm --filter @cellix/generator extend -- --context <context> --subdomain <subdomain> --field <field>:<type> --nested <name>:<field>:<type>
pnpm --filter @cellix/generator extend -- --context <context> --subdomain <subdomain> --name <name> --param <param>:<type>
```

An identity-bearing nested object is a collection. The `id:id` member is what makes it one. A nested object without an id is one value object. `extend --name` adds a parameter to a query or update that already exists. `?` before the type means the caller may omit it.

```bash
pnpm --filter @cellix/generator generate -- --context <context> --subdomain <subdomain> --nested activity-log:id:id,activityType:string
pnpm --filter @cellix/generator extend -- --context <context> --subdomain <subdomain> --field level:string --nested display-name:label:string
pnpm --filter @cellix/generator extend -- --context <context> --subdomain <subdomain> --nested activity-log:id:id,activityType:string
pnpm --filter @cellix/generator extend -- --context <context> --subdomain <subdomain> --name <name> --param "reason?:string"
```

`--subdomain` is the subdomain name. `--field` and `--param` are `name:type`. Write the type as given (`string`, `string[]`, `'small'|'large'`). A `|` outside double quotes is a shell pipe. A `?` outside double quotes is a shell glob. Repeat `--field` or `--param` with the same name, or wrap the whole argument in double quotes (`--field "status:'pending'|'approved'"`, `--param "reason?:string"`). Do not quote each alternative by itself. A bare word such as `pending` is the string literal `'pending'`. A nested object is its own file. Pass `--nested name:field:type` on the first `generate`, or on `extend` when the subdomain already exists. A nested object that includes `id:id` is a collection: a PropArray on the aggregate and a document array on the model. Do not add `[]` to its name. A nested object without an id is one value object. `extend` accepts new `--field` values, new `--nested` objects, or both. It wires them into the aggregate, the model, the seed, the adapter, and the repository. `extend --name <name> --param <name>:<type>` adds that parameter to a query or update that already exists. `name?:type` is optional. It does not replace the action. `generate` does not change a subdomain that already exists. `extend` is not the mutation command and it is not `pnpm update`. A `--param` may be named `id`. A `--field` may not. Do not pass `createdAt` or `updatedAt`. The model sets those. `query` and `update` require `--transport rest` or `--transport graphql`. A REST create uses the same `--route` and `--transport rest` on `generate --action`. Rest requires `--route`. `--route` is a path of names and `:param` segments, and it writes `/api/<route>`. A `:param` stays in the Hono path. The Azure registration writes `{param}`. `--method` is `get`, `post`, `patch`, `put`, or `delete`. Omitted, a query is `get` and a write is `post`. Leave `--route` off for graphql. `--name` is kebab-case. Do not pass `--return`. GraphQL `generate --action` writes that mutation's resolver. A GraphQL `query` writes the query field, and the resolver when it is missing. A later update adds a mutation.

The generator prints the files to fill in. The mongoose model, the barrels, the persistence adapter, the repositories, the unit of work, the context domain permissions, and each nested value-object file for this slice are on the session. Edit one when the change belongs there. The generator does not write the feature or the steps. Write them under `packages/axc-verification/acceptance-api/src/`. That directory is on the session. A file from another subdomain stays closed until a failing check names it. Read that aggregate with `dataSources.readonlyDataSource.<Context>.<Entity>.<Entity>ReadRepo.getById(id)`. It returns the reference or null. That call finds the seed `_id` after `insertMany`, including when the id is a string. Do not replace `getById` with `getAll`. Call this slice's query the same way before `getNewInstance` when a second row would be a duplicate. Throw `Object.assign(new Error('...'), { status: 409 })` for that conflict. A bad value throws status 400. A missing id throws status 404. The route returns that status. A transaction keeps that status. Do not replace it with 400. Change `minLength`, `maxLength`, or `pattern` on the existing `VOString`. The class body stays empty. A rejected assignment throws status 409 in the setter before `new ValueObjects.<Field>(value).valueOf()`. Append a collection entry in that setter with `getNewItem()`. Each step file sends its own request. A When or Then phrase is defined in one step file. A second file that repeats it fails the check. Add the scenario to the feature that already defines the phrase. The generated Then expects status 200. When the route returns another status, change that assertion in the same step file. Do not empty a step file, and do not move its request into another file. Leave a route this command did not add unchanged. An action file exports one Command and one const. A local helper is an unexported arrow. The word function fails the check. An identity-bearing nested object is already a collection. Append an entry with `getNewItem()`, then assign its fields. Do not call `addItem` with a plain object, and do not invent an id.

```ts
const entry = this.props.activityLog.getNewItem();
entry.activityType = activityType;
```

Do not declare that props type again. A model type besides the entity starts with the entity name and is used as a field type. A string that may be null is `string|null`. The type `string` is a required value object. Leave the read method and the update assignment blank until you fill them in. Do not copy `<camel>Seed` into a handler or a read repository. Dependencies and tsconfig references are already added. Do not edit `package.json`. Do not run `pnpm install`, `pnpm add`, `pnpm remove`, or `pnpm link`. A missing `@cellix/mongoose-seedwork` or `@cellix/config-typescript` link is repaired by `pnpm run agent-check -- pnpm run check`. Do not add a field or an action to force another generate. After `query`, `pnpm run agent-check -- pnpm run check` passes before you fill in behavior.

The generator writes `packages/axc/data-sources-mongoose-models` when that package is missing. Do not write that manifest yourself.

A query name cannot start with `create`, `update`, or `delete`. An update name cannot start with `query`, `get`, or `find`. Do not `generate` a create action unless the task writes rows through that action.

## Before the first check

Do not glob, grep, or read the tree first. Edit the files the generator printed, and a file a failing check names. Other reads are closed. Do not edit `package.json`. Do not run `pnpm install`. Do not redirect a check into a file.

- Pass an optional command field with a spread, and omit the property when the value is undefined.
- Copy the `insertMany` line from the seed file. The cast is already on that line.
- A Mongo filter is a typed object. Use dot access. `Record<string, unknown>` and bracket keys fail the check.

Run `pnpm run agent-check -- pnpm run check` while those behavior files change. The wrapper prints the first failure: the file, the rule, and the expected shape. A passing check on the scaffold is not the end. Do not add a script under `apps/docs`.

## Checks

While files change, run `pnpm run agent-check -- pnpm run check`. That is lint and typecheck. The wrapper prints the first failure: the file, the rule, and the expected shape. Do not pipe it, and do not redirect it into a file. Read a file again only when that block names it. When the block says the file would be reformatted, run `pnpm exec biome check --write` on that one file. A `Cannot find module` error for `@cellix/mongoose-seedwork` or `@cellix/config-typescript` is linked by that same check. Do not read `node_modules`, `pnpm-lock.yaml`, or `package.json`. Do not run `pnpm install`.

Read the files the task names. Do not list the tree. A new subdomain starts with `generate`. Add `query` only after that backend exists. Any other change edits the existing file. Do not assign `CELLIX_AGENT_ID`. A denial names a wrong path. Do not edit `ocom-write.config.json` or `.cellix/sessions`.

When the behavior, the seed rows, and the acceptance steps are in place, run `pnpm run agent-check -- pnpm run verify` once. Stop only after `CELLIX_VERIFY=pass`. Do not write `.cellix/verify.json`.

In `packages/axc-verification/acceptance-api/src/infrastructure.ts`, call `createMemoryMongoServer` from `@axc/service-mongoose`, await `start()`, and assign the uri before the API process spawns. That function is a one-node replica set. `withScopedTransaction` rejects a standalone server. Do not replace it with `MongoMemoryServer`. `@axc/service-mongoose` and `mongoose` are already dependencies. Do not edit `package.json` to add them.

```ts
const mongoUri = memoryMongo.getUri();
const env = process.env as { MONGODB_URI?: string };
env.MONGODB_URI = mongoUri;
```

Stop the server in `afterAll`. `apps/api/src/index.ts` already connects when `MONGODB_URI` is set. It does not construct `MongoMemoryServer`. Import `<camel>Seed` from `@axc/service-mongoose` and insert it with the line from the seed file. The generator already re-exports `<camel>Seed`. Persistence does not import the seed. Write one feature file and its step file for this action. A create step posts `courseId` from an active row in `course.seed.ts`. `COURSE_NOT_FOUND` means the posted id is not that `_id`. Do not add a second feature file. Do not add a fetch in a step. If you add one to see a failure, remove it and run verify again.

`generate` narrows reads and writes to the files it printed, and adds every model `*.seed.ts` to both lists. Read and edit those seeds. Instruction files stay readable. Do not edit `.cellix/sessions` to widen that list. A failing check names the next file. The last line of a failed check is the edit. A failed verify ends with `Acceptance:` — the scenario, Expected, Received, response body, and step file. That line is the next edit. Rerun acceptance with `pnpm run agent-check -- pnpm --filter @axc-verification/acceptance-api test:acceptance`. Do not glob a whole tree. Open `REFERENCE.md` only when a check names a file role.

## Writes

`ocom-write.config.json` has a `read` map and a `write` map. The first matching key in that map wins. A session at `.cellix/sessions/<CELLIX_AGENT_ID>.json` can list `read` and `write` separately. `files` is the write list when `write` is absent. The file exists at startup and holds the agent id. `generate` narrows that file's read and write lists to the slice. A session does not unlock a locked path. A shell assignment of `CELLIX_AGENT_ID` does not open a session. The shell may not have that variable.

File roles, visibility, and the dependency graph are in `REFERENCE.md` next to this file. Open that when a lint or write error names them.
