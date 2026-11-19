# File tree

`factory.json` supplies `<scope>` and the layer roots `<domain>`, `<application-services>`, `<persistence>`, `<models>`, `<graphql>`. Do not assume a scope or a product name. Substitute every token below from the sheet and that file.

| Token | Fill with |
| --- | --- |
| `<context>` | Singular kebab context from the Overview header. `harbor`, not `harbors` |
| `<Context>` | Pascal context |
| `<contextCamel>` | Camel context |
| `<subdomain>` | Singular kebab subdomain from the linked sheet tab. `harbor`, not `harbors` |
| `<Subdomain>` | Pascal subdomain |
| `<subdomainCamel>` | Camel subdomain |
| `<field>` | Property name, camelCase, as written on the sheet |
| `<Field>` | Pascal form of `<field>` |
| `<nested>` | Kebab form of a nested property |
| `<Nested>` | Pascal form of `<nested>` |
| `<child>` | Kebab form of a property nested inside `<nested>` |
| `<Child>` | Pascal form of `<child>` |
| `<permission>` | `canManage<Subdomain>` unless the user named another |
| `<scope>` | `scope` from `factory.json` |
| `<action>` | Kebab operation the user named |
| `<Action>` | Pascal form of `<action>` |
| `<actionCamel>` | Camel form of `<action>` |
| `<queue>` | Storage queue name, kebab, the user named |
| `<Queue>` | Pascal form of `<queue>` |
| `<schedule-env>` | Environment variable that holds the timer cron, the user named |
| `<queue-operations>` | `src` of the `queue-operations` package beside the application-services package |
| `<timer-operations>` | `src` of the `timer-operations` package beside the application-services package |
| `<api-composition>` | `apiComposition` from `factory.json` |

A header `Item Detail` is context `item-detail`. A sheet tab `itemDetail` is subdomain `item-detail`. A sheet tab that is already one word stays that word. A property `label` is `<field>` `label` and `<Field>` `Label`.

Open the linked page for every file you write. The page is the file body. Do not copy a second layout from an existing product.

A new subdomain writes the Domain, Model, Seed, Persistence, and Application service sections. GraphQL belongs to [workflows/add-graphql-operation.md](workflows/add-graphql-operation.md). Queue and timer are their own workflows.

## Domain

`<domain>/domain/contexts/`

```text
passport.ts                                          → files/domain/passport.md
<context>/
  <context>.domain-permissions.ts                    → files/domain/context.domain-permissions.md
  <context>.visa.ts                                  → files/domain/context.visa.md
  <context>.passport.ts                              → files/domain/context.passport.md
  index.ts                                           → files/domain/context.index.md
  <subdomain>/
    <subdomain>.value-objects.ts                     → files/domain/subdomain.value-objects.md
    <subdomain>.aggregate.ts                         → files/domain/subdomain.aggregate.md
    <subdomain>.repository.ts                        → files/domain/subdomain.repository.md
    <subdomain>.uow.ts                               → files/domain/subdomain.uow.md
    <nested>.value-object.ts                         → files/domain/nested.value-object.md
    <parent>-<nested>.value-object.ts                → files/domain/parent-nested.value-object.md
    <nested>.entity.ts                               → files/domain/nested.entity.md
    <nested>.value-objects.ts                        → files/domain/nested.value-objects.md
    index.ts                                         → files/domain/subdomain.index.md
```

`contexts/index.ts` adds `export * as <Context>`. That line is in [files/domain/contexts.index.md](files/domain/contexts.index.md). `<domain>/index.ts` gains the `DomainDataSource` member in [files/domain/index.md](files/domain/index.md). Add the member. Do not replace the file.

`<subdomain>.value-objects.ts` and `<nested>.value-objects.ts` are written only for a string that has a length or a pattern. A plain string gets no class. `<parent>-<nested>.value-object.ts` is the file when `<nested>` is already used in the folder. A subdomain named `role`, or whose name ends in `-role`, such as `dock-role`, is a role aggregate. Open [files/domain/role.aggregate.md](files/domain/role.aggregate.md) instead of the ordinary aggregate page. The aggregate file may be `<subdomain>.ts`. Map its permissions the way this tree maps a subdomain: one composer, then one file per group.

```text
<subdomain>/
  <subdomain>.ts                                     → files/domain/role.aggregate.md
  <subdomain>-permissions.ts                         → files/domain/role.aggregate.md
  <subdomain>-<group>-permissions.ts                 → files/domain/role.aggregate.md
```

A repo that has a system passport class per context also gets `<domain>/domain/iam/system/contexts/system.<context>.passport.ts`, in [files/domain/system.context.passport.md](files/domain/system.context.passport.md).

## Model

`<models>/models/<subdomain>/`

```text
<subdomain>.model.ts                                 → files/data-sources-mongoose-models/subdomain.model.md
```

`<models>/index.ts` registers the factory. The body is [files/data-sources-mongoose-models/index.md](files/data-sources-mongoose-models/index.md).

## Seed

`apps/server-mongodb-memory-mock/src/seed/`

```text
<subdomain>.ts                                       → files/server-mongodb-memory-mock/subdomain.seed.md
seed.ts                                              → files/server-mongodb-memory-mock/subdomain.seed.md
```

## Persistence

`<persistence>/datasources/`

```text
domain/index.ts                                      → files/persistence/domain/index.md
domain/<context>/index.ts                            → files/persistence/domain/context.index.md
domain/<context>/<subdomain>/
  <subdomain>.domain-adapter.ts                      → files/persistence/domain/subdomain.domain-adapter.md
  <subdomain>.repository.ts                          → files/persistence/domain/subdomain.repository.md
  <subdomain>.uow.ts                                 → files/persistence/domain/subdomain.uow.md
  index.ts                                           → files/persistence/domain/subdomain.index.md
readonly/index.ts                                    → files/persistence/readonly/index.md
readonly/<context>/index.ts                          → files/persistence/readonly/context.index.md
readonly/<context>/<subdomain>/
  <subdomain>.data.ts                                → files/persistence/readonly/subdomain.data.md
  <subdomain>.read-repository.ts                     → files/persistence/readonly/subdomain.read-repository.md
  index.ts                                           → files/persistence/readonly/subdomain.index.md
```

Add the branch on a file that already exists. Do not drop an existing context.

## Application service

`<application-services>/contexts/<context>/<subdomain>/`

```text
query-by-id.ts                                       → files/application-services/query-by-id.md
<action>.ts                                          → files/application-services/action.md
index.ts                                             → files/application-services/subdomain.index.md
```

`<application-services>/contexts/<context>/index.ts` is [files/application-services/context.index.md](files/application-services/context.index.md). `<application-services>/index.ts` is [files/application-services/index.md](files/application-services/index.md). Add the member. Do not replace the file.

## Transports

A new subdomain does not write these. Each operation the user names picks one flow.

GraphQL, from [workflows/add-graphql-operation.md](workflows/add-graphql-operation.md):

```text
<graphql>/<subdomain>.graphql                       → files/graphql/subdomain.graphql.md
<graphql>/<subdomain>.resolvers.ts                  → files/graphql/subdomain.resolvers.md
```

Queue, from [workflows/add-queue-operation.md](workflows/add-queue-operation.md):

```text
<queue-operations>/fn_queue_handler_<queue>/index.ts → files/queue-operations/fn_queue_handler_queue.index.md
<queue-operations>/index.ts                          → files/queue-operations/index.md
<api-composition>                                    → files/queue-operations/fn_queue_handler_queue.index.md
```

`<queue>` in the folder uses `_` where the queue name uses `-`.

Timer, from [workflows/add-timer-operation.md](workflows/add-timer-operation.md):

```text
<timer-operations>/fn_timer_handler_<action>/index.ts → files/timer-operations/fn_timer_handler_action.index.md
<timer-operations>/index.ts                           → files/timer-operations/index.md
<api-composition>                                     → files/timer-operations/fn_timer_handler_action.index.md
```

`<action>` in the timer folder uses `_` where the operation name uses `-`.
