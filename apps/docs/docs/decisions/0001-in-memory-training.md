---
id: 0001-in-memory-training
title: In-memory training catalog and enrollment storage
status: accepted
date: 2026-11-05
---

# In-memory training catalog and enrollment storage

## Context and Problem Statement

Task Sets A and B require a searchable sample catalog and an enrollment workflow without external services. Task Set B forbids introducing database infrastructure when the sample uses fixtures. The starting application has no database.

## Considered Options

- Per-process in-memory repositories and deterministic course fixtures.
- File persistence with locking and recovery.
- A real database.

## Decision Outcome

Use in-memory repositories injected once from the API composition root. Keep twelve course fixtures and one enrollment map per process. A serialized copy-on-write unit of work makes duplicate checks and writes atomic and discards changes after any thrown error. Read repositories and writes copy nested values to prevent accidental mutation. Commands use the enrollment aggregate, and queries use read repositories.

Use lowercased, trimmed email addresses to identify learners consistently. Trim justification and audit actor/reason inputs before checking their meaningful content. Creation is attributed to `system`; status updates record the caller-supplied operator. This follows the task's unauthenticated sample convention.

## Consequences

Data resets when the API restarts. Separate processes have separate stores; uniqueness is guaranteed only within a single process. This is suitable for the non-production harness, not durable multi-instance use. File storage adds coordination complexity; a database conflicts with the task constraint. No new third-party runtime dependency is needed.
