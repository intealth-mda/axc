# Cellix reference index

Navigation only: source priority and mandatory loading are in the [skill](../SKILL.md). Inspect actual source plus applicable parent/sibling composition, interfaces, exports, and test companions. Reuse these anchors; search beyond them only when missing or behaviorally unsuitable.

## Composition

| Pattern | Reference |
| --- | --- |
| API bootstrap and handler registration | `apps/api/src/index.ts` |
| Application-services host construction | `packages/ocom/application-services/src/index.ts` |

## Application Services

| Pattern | Reference |
| --- | --- |
| Context composition | `packages/ocom/application-services/src/contexts/service/index.ts` |
| Context API aliases and explicit service types | `packages/ocom/application-services/src/contexts/community/index.ts` |
| Entity application-service interface and composition | `packages/ocom/application-services/src/contexts/service/service/index.ts` |
| Curried mutation operation | `packages/ocom/application-services/src/contexts/service/service/create.ts` |
| Read-side query operation | `packages/ocom/application-services/src/contexts/user/end-user/query-by-name.ts` |

## Domain

| Pattern | Reference |
| --- | --- |
| Context organization and exports | `packages/ocom/domain/src/domain/contexts/index.ts`; `packages/ocom/domain/src/domain/contexts/community/community/index.ts` |
| Aggregate and entity reference | `packages/ocom/domain/src/domain/contexts/community/community/community.ts` |
| Mutation-side repository contract | `packages/ocom/domain/src/domain/contexts/community/community/community.repository.ts` |
| Value objects and unit of work, when needed | `packages/ocom/domain/src/domain/contexts/community/community/community.value-objects.ts`; `packages/ocom/domain/src/domain/contexts/community/community/community.uow.ts` |
| Stateful workflow aggregate, props, and entity reference | `packages/ocom/domain/src/domain/contexts/case/service-ticket/v1/service-ticket-v1.aggregate.ts` |
| Stateful workflow value objects | `packages/ocom/domain/src/domain/contexts/case/service-ticket/v1/service-ticket-v1.value-objects.ts` |
| Child entities with their own lifecycle | `packages/ocom/domain/src/domain/contexts/case/service-ticket/v1/service-ticket-v1-activity-detail.entity.ts`; `packages/ocom/domain/src/domain/contexts/case/service-ticket/v1/service-ticket-v1-message.entity.ts` |
| Stateful workflow repository and unit of work | `packages/ocom/domain/src/domain/contexts/case/service-ticket/v1/service-ticket-v1.repository.ts`; `packages/ocom/domain/src/domain/contexts/case/service-ticket/v1/service-ticket-v1.uow.ts` |
| Aggregate authorization policy | `packages/ocom/domain/src/domain/contexts/case/service-ticket/v1/service-ticket-v1.visa.ts` |
| Focused aggregate and value-object tests | `packages/ocom/domain/src/domain/contexts/case/service-ticket/v1/service-ticket-v1.aggregate.test.ts`; `packages/ocom/domain/src/domain/contexts/case/service-ticket/v1/service-ticket-v1.value-objects.test.ts` |
| Search specifications | `packages/ocom/domain/src/domain/contexts/community/member/member.search-specs.ts` |

## Persistence and Read Models

| Pattern | Reference |
| --- | --- |
| Persistence composition | `packages/ocom/persistence/src/index.ts` |
| Data-source interfaces and factory | `packages/ocom/persistence/src/datasources/index.ts` |
| Read-side data-source composition | `packages/ocom/persistence/src/datasources/readonly/index.ts` |
| Read-context composition | `packages/ocom/persistence/src/datasources/readonly/community/index.ts` |
| Read-entity composition | `packages/ocom/persistence/src/datasources/readonly/community/community/index.ts` |
| Read repository interface and implementation | `packages/ocom/persistence/src/datasources/readonly/community/community/community.read-repository.ts` |
| Read data source | `packages/ocom/persistence/src/datasources/readonly/community/community/community.data.ts` |

## Mongoose Storage Models

| Pattern | Reference |
| --- | --- |
| Model context builder and registration | `packages/ocom/data-sources-mongoose-models/src/index.ts` |
| Standalone record, typed schema, factory, name and type | `packages/ocom/data-sources-mongoose-models/src/models/community/community.model.ts` |
| Shared base model and discriminator ordering | `packages/ocom/data-sources-mongoose-models/src/models/case/ticket.model.ts`; `packages/ocom/data-sources-mongoose-models/src/models/case/service-ticket.model.ts` |
| Nested audit/history subdocuments and nested paths | `packages/ocom/data-sources-mongoose-models/src/models/case/service-ticket.model.ts` |
| Model context consumed by persistence | `packages/ocom/persistence/src/index.ts`; `packages/ocom/persistence/src/datasources/index.ts` |
| Reusable schema/factory and boundary checks | `packages/cellix/archunit-tests/src/checks/data-sources-mongoose-models-conventions.ts`; `packages/cellix/archunit-tests/src/test-suites/data-sources-mongoose-models-conventions.ts` |
| Upstream suite configuration | `packages/ocom/data-sources-mongoose-models/src/archunit-tests/data-sources-mongoose-models-conventions.test.ts` |

Inspect these models alongside the selected domain/persistence slice, including query-only and fixture-backed features. Record storage fields, nested lifecycle choice, exports, context registration, consumers, and focused schema/round-trip evidence. The reference has no colocated model unit tests in these example directories; add focused tests for AXC schema behavior rather than inventing reference companions.

## Command-Side Persistence

| Pattern | Reference |
| --- | --- |
| Aggregate persistence adapter and conversion | `packages/ocom/persistence/src/datasources/domain/case/service-ticket-v1/service-ticket-v1.domain-adapter.ts` |
| Domain repository implementation | `packages/ocom/persistence/src/datasources/domain/case/service-ticket-v1/service-ticket-v1.repository.ts` |
| Unit-of-work implementation | `packages/ocom/persistence/src/datasources/domain/case/service-ticket-v1/service-ticket-v1.uow.ts` |
| Persistence composition and exports | `packages/ocom/persistence/src/datasources/domain/case/service-ticket-v1/index.ts` |
| Adapter, repository, and unit-of-work tests | `packages/ocom/persistence/src/datasources/domain/case/service-ticket-v1/*.test.ts`; `packages/ocom/persistence/src/datasources/domain/case/service-ticket-v1/*.feature` |

## Transport

| Pattern | Reference |
| --- | --- |
| Thin REST handler | `packages/ocom/rest/src/index.ts` |
| Feature-oriented transport handlers | `packages/ocom/graphql-handler/src/features/**` |

## Architecture Verification

| Pattern | Reference |
| --- | --- |
| Application-service convention suite | `packages/cellix/archunit-tests/src/test-suites/application-services-conventions.ts` |
| Application-service checks | `packages/cellix/archunit-tests/src/checks/application-services-conventions.ts` |
| Dependency rules | `packages/cellix/archunit-tests/src/test-suites/dependency-rules.ts` |
| Domain conventions | `packages/cellix/archunit-tests/src/checks/domain-conventions.ts` |
| Persistence conventions | `packages/cellix/archunit-tests/src/checks/persistence-conventions.ts` |
