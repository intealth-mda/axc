## Task Set J: Learner Profiles with Optimistic Concurrency

You are working in a non-production sample codebase for an agentic coding harness evaluation.

Task Set ID: TS-J-LEARNER-PROFILES

Task Name: Learner Profiles with Optimistic Concurrency

Refer to markdown requirements defining Task Set J (task-set-j-requirements.md)

### Overview

Implement learner profiles that are safe to edit concurrently: POST /api/learners, GET /api/learners/{id}, and PUT /api/learners/{id} guarded by a version number.

Use only the allowed write boundary:

- apps/api/** rest routing / functional wiring
- packages/cellix/** can continue to port over packages from github repo CellixJS/cellixjs; these vendored packages should **NEVER** deviate from the original source repository
- packages/axc/rest/** hono logic
- packages/axc/application-services/** application services
- packages/axc/persistence/** data storage
- packages/axc/service-mongoose/** data storage
- packages/axc/** do not create any additional directories beyond what already exist
- packages/axc-verification/** unit, integration, architectural and acceptance tests
- apps/docs/** any configuration necessary to get documentation functional
- apps/docs/ ** MADR / API documentation

Do not modify authentication, production configuration, deployment pipelines, secrets, environment files, unrelated domains, or external integrations. Do not add dependencies unless clearly justified.

### Requirements:

1. Create a LearnerProfile model with id, email, displayName, bio, version, createdAt, and updatedAt.
2. Add POST /api/learners. A valid request returns HTTP 201 with the new profile at version 1.
3. email must be a valid email address. It is stored lowercased and must be unique, case-insensitively.
4. displayName must be 2 to 60 characters after trimming.
5. bio is optional and at most 280 characters.
6. Add GET /api/learners/{id}. An unknown id returns HTTP 404 with error code LEARNER_NOT_FOUND.
7. Add PUT /api/learners/{id}. The body carries the editable fields and the version the client last read.
8. An update with the current version succeeds and increments version by exactly 1.
9. An update with any other version returns HTTP 409 with error code VERSION_CONFLICT and changes nothing.
10. Validation failures return HTTP 400 with error code INVALID_REQUEST. A duplicate email returns HTTP 409 with error code DUPLICATE_LEARNER_EMAIL.
11. Add tests for creation, validation, retrieval, successful updates, version increments, stale updates, duplicate email, and not found.
12. Add or update learner profile documentation.

Run the relevant tests, lint, and build commands if available. Provide a short summary of what changed, commands run, test results, cost/usage and any known limitations.
