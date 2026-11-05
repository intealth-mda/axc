---
id: 0001-in-memory-catalog
title: In-memory course catalog
status: accepted
date: 2026-11-05
---

## Context and Problem Statement

TS-A-CATALOG-SEARCH requires at least 12 fixtures and testing without external services or production data. No database connection is configured in this sample.

## Considered Options

- Deterministic in-memory fixtures behind a read repository.
- A database-backed catalog requiring an external service.

## Decision Outcome

Use in-memory fixtures behind `readonlyDataSource.Catalog.Course.CourseReadRepo`. The API composition root constructs persistence and injects its factory into application services. The domain owns query types, allowed values and validation; REST handles HTTP parsing and error responses. Unknown, empty and repeated parameters are rejected. Sorts ascend and ties use id for deterministic pagination.

## Consequences

Tests need no external data service. Results remain deterministic and returned records are copied. Data is process-local and read-only; durable storage and catalog editing remain outside this task.
