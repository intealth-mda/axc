# Fixture-backed training workflow

Status: Accepted for the non-production sample.

Course and EnrollmentRequest have independent identities and are Cellix aggregates in the training context. Enrollment status transitions and history updates belong to the aggregate. History entries have no independent identity or lifecycle, so they are immutable snapshots rather than child aggregates.

Application operations use read repositories for queries and a domain repository within an initialized Cellix unit of work for commands. Stored records pass through a props adapter and converter. Composition injects data sources from the API host, retaining health behavior.

Use a process-local serialized copy-on-write transaction store. This makes duplicate detection and history updates atomic, rolls back failures, and prevents returned objects from mutating committed storage. It requires no external service and deliberately provides no restart durability or cross-process coordination. Course mutations are outside scope.

The storage-model package follows the repository's explicit AGENTS exception. Typed schemas and model factories use string IDs and ISO strings to preserve the API/fixture contract. Native Mongoose model registration replaces the Cellix factory's Base constraint, which assumes ObjectIds and Date timestamps. No connection is opened. Events, authorization visas, document inheritance, and population are omitted because the sample has no consumers, authorization policy, shared document hierarchy, or database references.

Errors carry stable codes and details from the application/domain boundary. Hono maps these to HTTP statuses. Inputs are checked even when application services are called directly. Email normalization makes duplicate detection deterministic.
