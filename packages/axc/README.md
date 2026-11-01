# @axc

Application layer for agentCourses. Packages follow the Cellix layout:

| Package | Role |
| --- | --- |
| `@axc/domain` | Domain model extension point. Uses `@cellix/domain-seedwork`. Must not import REST, Hono, Azure Functions, Mongoose, or persistence implementations. |
| `@axc/persistence` | Persistence extension point. Uses the Cellix unit-of-work contract. |
| `@axc/service-mongoose` | Mongoose infrastructure extension point. Uses `@cellix/mongoose-seedwork` and `mongodb-memory-server-core`. |
| `@axc/application-services` | Use cases. The healthcheck status is produced here. |
| `@axc/rest` | Hono routes. Application services are injected by `@apps/api`. |

`@apps/api` is the composition root. It injects dependencies into `@axc/rest` through the Cellix bootstrap in `@cellix/api-core`.

## Adding a REST endpoint

Work through the layers in this order:

1. **`@axc/application-services`** (`src/`): add the types, validation, and use case. Expose it on `ApplicationServices` and wire it in `buildApplicationServicesFactory`. Export only what `@axc/rest` needs, because knip flags unused exports.
2. **`@axc/rest`** (`src/index.ts`): add `app.get('/api/<name>', ...)` in `createRestApp`. Resolve services with the same `forRequest(authorization)` pattern as `/health`, and map validation failures to 400.
3. **`@apps/api`** (`apps/api/src/index.ts`): register `.registerAzureFunctionHttpHandler('<name>', { route: 'api/<name>', methods: ['GET'], authLevel: 'anonymous' }, restHandlerCreator)`. `host.json` sets `routePrefix: ""`, so the Azure route must include `api/` and match the Hono path exactly. Feature endpoints live under `/api/`; `/health` is an infrastructure route deliberately served at the root (`route: 'health'`).
4. **Docs**: add `apps/docs/docs/<name>.md` (path, params table, success and error JSON, curl) and an entry in `apps/docs/sidebars.ts`.

Tests (owned by the unit tester):

- Use cases: colocated `*.test.ts` in `@axc/application-services`.
- HTTP: `packages/axc/rest/src/index.test.ts`, calling `createRestApp(buildApplicationServicesFactory({ environment: 'test' })).request('/api/<name>?...')`. Cover each new branch, including a request with an `Authorization` header.
- Acceptance: `packages/axc-verification/acceptance-api/src/features/<name>.feature` and `step-definitions/<name>.steps.ts`. Keep it to a few scenarios, because each run boots an Azure Functions host.
- The REST vitest config aliases `@axc/application-services` to its `src/`, so REST tests do not need a build first. Typecheck and acceptance still use `dist/`, so run `pnpm run build` before them.

Gotchas:

- Do not leave scratch `.js`, `.mjs`, or `.ts` files in `.agents-work/`. The pre-commit `biome check .` scans them.
- Locally, the portless proxy listens on port 1355, for example `https://api.agentcourses.localhost:1355/api/<name>`.
- `func start` hosts from earlier runs can linger. Check with `ps -ax | grep 'func start'`.
