# Serve the course catalog from the Course aggregate

## Context and Problem Statement

The training catalog needs `GET /api/courses` with keyword search, modality, status, and tag filters, plus paging and sorting. The Course sheet is the source of truth for the fields. The API process does not receive a database connection string, and the feature has to be testable without an external service.

## Decision Drivers

* The response contract is fixed: page metadata, ISO timestamps, and HTTP 400 for invalid query parameters.
* Course fields, lengths, and enums come from the system-design workbook.
* Existing health behavior stays in place.
* Domain code stays free of Hono and Mongoose.

## Considered Options

* Read a Mongoose `courses` collection on each request.
* Serve the workbook-shaped sample catalog through the course application service.

## Decision Outcome

Chosen option: "Serve the workbook-shaped sample catalog through the course application service", because the functions host has no configured database and the catalog must answer without an external service.

The Course aggregate still enforces title, summary, modality, status, and tag rules. A Mongoose model, collection name `courses`, and seed documents exist for a later database connection. Query validation stays in the Hono route. Search, sort, and paging stay in the application service.

### Consequences

* Good, because `GET /api/courses` and `GET /health` share one Hono app and the health contract is unchanged.
* Good, because tests cover filters, paging, sorting, validation, and empty results without a network service.
* Bad, because a deployed API does not query MongoDB until a connection is composed into the read repository. The sample rows are the catalog the route returns today.

## Confirmation

`packages/axc/rest` requests `GET /api/courses` against the composed application service and checks the success and error contracts.
