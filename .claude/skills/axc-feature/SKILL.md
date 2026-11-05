---
name: axc-feature
description: Step-by-step guide for adding a feature slice to the axc API (use case in @axc/application-services, Hono route in @axc/rest, Azure Functions registration in @apps/api, docs page, unit, REST and acceptance tests), using the existing /health slice as the worked example. Use before planning or writing any new endpoint, use case, or acceptance feature in this repository.
---

# Adding a feature slice to axc

Copy the `/health` slice. It is the reference for every layer. Read only the files named here; do not explore the repo.

| Layer | File to change | Pattern to copy |
| --- | --- | --- |
| Use case | `packages/axc/application-services/src/<feature>.ts` + export from `src/index.ts` | `health` in `src/index.ts` |
| Route | `packages/axc/rest/src/index.ts` (`createRestApp`) | `app.get('/health', ...)` |
| Function | `apps/api/src/index.ts` | `.registerAzureFunctionHttpHandler('health', ...)` |
| Docs | `apps/docs/docs/<feature>.md` + `apps/docs/sidebars.ts` | `apps/docs/docs/healthcheck.md` |
| Use-case tests | `packages/axc/application-services/src/<feature>.test.ts` | `src/health.test.ts` |
| REST tests | `packages/axc/rest/src/index.test.ts` | the three `/health` tests |
| Acceptance | `packages/axc-verification/acceptance-api/src/features/<feature>.feature` + `step-definitions/<feature>.steps.ts` | `healthcheck.feature` + `healthcheck.steps.ts` |

## 1. Use case (`@axc/application-services`)

- Add the types, input validation, and use case in `src/<feature>.ts`. Keep it framework-free: no `hono`, `@azure/*`, or `mongoose` imports.
- Add the service to the `ApplicationServices` interface and build it inside `buildApplicationServicesFactory` → `forRequest`, next to `health`.
- Return validation failures as a typed result (for example `{ ok: false, errors: [...] }`) rather than throwing, so the route can map them to `400`.
- Export only what `@axc/rest` and `@apps/api` use. knip fails `verify` on unused exports.

## 2. Route (`@axc/rest`)

```ts
app.get('/api/<feature>', async (c) => {
	const authorization = c.req.header('Authorization');
	const services = authorization === undefined ? await applicationServicesFactory.forRequest() : await applicationServicesFactory.forRequest(authorization);
	const result = services.<feature>.<useCase>(/* parsed query or body */);
	return result.ok ? c.json(result.value) : c.json({ errors: result.errors }, 400);
});
```

Feature routes live under `/api/`. `/health` is the only root route.

## 3. Function registration (`@apps/api`)

```ts
.registerAzureFunctionHttpHandler('<feature>', { route: 'api/<feature>', methods: ['GET'], authLevel: 'anonymous' }, restHandlerCreator)
```

`host.json` sets `routePrefix: ""`, so `route` must include `api/` and match the Hono path exactly. Chain it before `.startUp()`.

## 4. Docs (`apps/docs`)

Copy `healthcheck.md`: title, one-line summary, request, a params table, success and error JSON, and a curl example. Add the page id to the `docs` array in `sidebars.ts`.

## 5. Tests (written by the unit tester)

- **Use case:** call `buildApplicationServicesFactory({ environment: 'test' }).forRequest()` and assert on the service's result. Cover each validation rule and the success path.
- **REST:** `createRestApp(buildApplicationServicesFactory({ environment: 'test' })).request('/api/<feature>?...')`. Assert status and JSON body. Cover `200`, each `400` branch, and a request with an `Authorization` header (see the `spyFactory` tests).
- **Acceptance:** two or three scenarios at most, because each run boots an Azure Functions host. Reuse the `actorCalled`, `Send.a(GetRequest.to(...))`, and `LastResponse` pattern from `healthcheck.steps.ts`.

## Rules the gates enforce

- `test:arch`: `domain` must not import `hono`, `@azure/*`, `mongoose`, `mongodb`, or any other `@axc/*` package. `application-services` must not import `rest`. Keep dependencies pointing inward: rest → application-services → domain.
- `knip`: no unused exports, files, or dependencies.
- `biome`: tabs, single quotes, line width 230. The Stop gate auto-formats changed files.
- Never change `packages/cellix/**`; it is vendored from upstream CellixJS.

## Validate

- While iterating: `pnpm --filter @axc/application-services test`, `pnpm --filter @axc/rest test`.
- Before finishing: `node .claude/scripts/gate.mjs` (changed files and affected packages, compact output).
- Acceptance and typecheck use `dist/`, so run `pnpm run build` before `pnpm run test:acceptance`.
