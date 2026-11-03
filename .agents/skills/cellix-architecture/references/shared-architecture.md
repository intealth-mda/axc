# Shared Cellix requirements

Mandatory for every applicable implementation or review. Classify concepts before selecting files; folder names, endpoint count, and task simplicity never bypass domain classification. Use the [architecture map](architecture-map.md) to locate source, then inspect the applicable slice and its composition, exports, and test companions.

- Keep `apps/api` as the composition root. Do not place business rules or storage behavior there.

- Construct or register the data-sources factory in the API composition context and inject it into the application-services host. Do not call a concrete persistence factory such as `createDataSources()` inside `buildApplicationServicesFactory`.

- Keep every persisted business object and its props, entity reference, domain values, and invariants in `packages/axc/domain`, including objects whose current API only queries them, such as Course. Model an independently identified and lifecycle-owned object as a Cellix aggregate root by default; require a behavior-based Cellix justification for a different choice. Put read-side repository interfaces, implementations, and fixture data in `packages/axc/persistence`; a `*ReadRepository` must not live in domain.

- For aggregate roots, implement the applicable Cellix aggregate root, a static `getNewInstance` creation factory, props and entity-reference pattern, value objects, child entities, exports, and focused tests. Keep reconstruction of stored objects distinct from creation through `getNewInstance`; the factory establishes valid initial state. Add mutation-side repository and unit-of-work contracts and adapters when commands are in scope; record their deferred responsibilities when commands are not yet exposed. Creation plus state transitions, audit or history, nested lifecycle, or transactional invariants require the full applicable command-side pattern. Do not model an aggregate as a public mutable record operated on by free mutation functions.

- Represent constrained or normalized domain values with Cellix-aligned value objects. Model nested records as child entities, value objects, or prop arrays according to identity and lifecycle; do not leave those decisions implicit in transport or persistence types.

- Follow the applicable Cellix context/entity directory structure, filename suffixes, public exports, and required feature behavior. For example, use `*.aggregate.ts` for an aggregate root, `*.read-repository.ts` for a read repository, and `*.repository.ts` for a domain repository. A query-only API still needs its matching domain slice and context export. Do not collapse a feature into a root `course.ts` or `readonly/course.ts` when the analogous Cellix slice separates context, entity, and repository files.

- Use the chosen context name consistently across domain, application services, persistence, data-source namespaces, and public APIs. Do not substitute a different context name in one layer.

- Organize application behavior under context and feature modules in `packages/axc/application-services/src/contexts`. Keep the package root focused on host interfaces and composition.

- In application-service context composition, follow the Cellix import pattern: alias each entity API distinctly from its service type, and expose a named context service interface rather than relying only on an inferred return type.

- Define each public application-service command, query, and result contract in the application-service or domain layer. Entity application-service modules may import `DataSources` from persistence for injection, but must not expose persistence query, page, filter, or repository types in their public methods. Compare the analogous Cellix operation file, which declares its query or command input beside the curried operation.

- Give each public entity application-service operation its own context/entity operation file. Keep the entity `index.ts` focused on its named service interface, operation imports, and composition; do not implement queries or mutations inline there.

- Keep application failure codes and details independent of HTTP status numbers. Map failure codes to HTTP statuses in REST feature modules. Test both direct application-service errors and the transport mapping; do not put status numbers in application-service error constructors or types.

- Follow the Cellix curried application-service pattern. Inject `DataSources` first, then accept a command or query input.

- Use `readonlyDataSource` for queries and the domain data source with a scoped transaction for mutations.

- Keep fixture or in-memory storage behind a data-source or repository boundary. Production composition and package entry points must not own fixture collections.

- For persisted business objects, including query-only objects and fixture-backed Task B workflows, create storage models in the separate `packages/axc/data-sources-mongoose-models` workspace package. Follow Cellix `src/models/<context>/<entity>.model.ts`: typed Mongoose schema, exported `*ModelName`, `*ModelFactory`, and `*ModelType`; standalone records extend `MongooseSeedwork.Base` and use `MongooseSeedwork.modelFactory`. Use the same context/entity names across layers. Model nested history/children with the applicable subdocument or nested-path pattern; use discriminators only for an actual shared storage hierarchy. Inspect the matching Cellix schema rather than copying unrelated fields or forcing discriminator inheritance.

- Export `mongooseContextBuilder` from the models package entry point and compose every model factory there, including base-before-discriminator ordering when applicable. Persistence consumes the models package contracts; when Mongoose is used, build the model context from the injected initialized service and pass it through data-source composition. Models must not import domain, persistence, application services, REST, or API composition. Keep schemas out of those layers. Fixture-backed storage may remain in memory without starting a real database, but does not excuse missing storage models or an unused models package. Test schema constraints/defaults, nested history preservation, factory/context registration, and adapter round trips at their owning layer; connection-free schema validation can cover models. The health-only scaffold needs no placeholder models. Task B permits creating this package and its context directories; retain its prohibition on introducing a real database.

- Compose persistence at the same applicable entity, context, and data-source levels as the closest Cellix slice. Do not replace those composition modules with one root file that imports every concrete repository unless the reference or a documented constraint calls for it.

- Keep `packages/axc/rest/src/index.ts` focused on application construction and feature registration. Put non-health routes, transport validation, and error mapping in feature modules.

- Treat application services as the feature boundary for production transport code. Transport must not import persistence contracts or access persistence or infrastructure directly. Prefer application-service public contracts or transport-local input types over direct domain imports; use a direct domain contract only when the closest Cellix transport pattern requires it and record that decision.

- Reuse existing Cellix packages and patterns. Do not create a project-specific replacement for an available Cellix capability.

- Do not modify vendored `packages/cellix/**` code for an application feature. Port upstream Cellix changes exactly when that work is explicitly requested.

- When no close reference exists, use the nearest Cellix pattern and record the deviation and rationale in the alignment review.

- Domain must not depend on application services, transport, persistence, or infrastructure. Put named business concepts under `packages/axc/domain/src/domain/contexts/<context>/<entity>/`, with `DomainEntityProps` and public references as applicable. Use `DomainEntity` for child entities or behaviorally justified alternatives, never merely because writes are absent. Return domain entity references from services when the selected Cellix slice does so.

- Keep package root `index.ts` files limited to public contracts, exports, and composition. A separate read-side `*.data.ts` is required when the selected data-source responsibility applies; do not add empty layers solely to mirror a reference.

