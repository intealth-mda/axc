---
id: 0001-in-memory-catalog
title: In-memory course catalog
status: accepted
date: 2026-11-05
---

## Context and Problem Statement

TS-A-CATALOG-SEARCH requires at least twelve fixtures and testing without external
services or production data. The sample application has no database configured.

## Considered Options

- Fixed in-memory fixtures behind a read repository.
- Database storage requiring infrastructure and external services.

## Decision Outcome

Use twelve in-memory fixtures, injected by apps/api through a data source factory.
Search rules are checked in the domain through the application service; REST parses
inputs and maps validation errors. No write aggregate is needed for this read endpoint.
Use ascending sort with id ties, literal keyword substrings, exact tags, and HTTP 400
for present but empty values. Unknown query names are ignored and repeated names use
the first value, following the existing HTTP parser.

## Consequences

The catalog is deterministic and requires no external integration. Results and tag
arrays are copied on read. Fixtures remain fixed for the process lifetime; changes
require a code update. Database-backed editing is outside this task.
