# In-memory training workflow with Cellix boundaries

Status: accepted for this sample.

## Context

Course search and enrollment requests must run without external services while retaining replaceable storage and enforcing transition, duplicate and audit invariants.

## Decision

Use the training context across domain, application services and persistence. Course and EnrollmentRequest are Cellix aggregate roots. Course modality/status and enrollment status/email/justification are constrained value objects. Audit history entries are immutable owned values without independent identity.

Application operations inject DataSources; queries use readonly repositories and mutations use the initialized enrollment unit of work. The API injects a factory and REST maps stable failures to HTTP. Typed Mongoose schemas and factories describe storage contracts without opening a database connection. Fixture validation consumes the Course schema. Domain adapters and converters isolate stored enrollment records from aggregates.

Serialize transactions using a per-store promise queue, work against detached records, and replace the committed map only after success. Repository save checks active duplicates within that serialized scope. Reads and saves return copies. Exceptions roll back all writes and release the queue.

## Consequences

The implementation is deterministic and testable without a database. Worker restarts lose requests, multiple workers do not share invariants, and audit labels are unverified. Production persistence would require durable transactions and a cross-process uniqueness constraint. Mongo sessions, ObjectIds, permission policies and event publication are intentionally absent because the sample has no database, authenticated actors or event consumers.
