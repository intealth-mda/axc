---
slug: /
---

# agentCourses API

agentCourses is a dark software factory scaffold. HTTP capabilities are composed by `@apps/api` and served through Hono routes in `@axc/rest`.

- [Healthcheck](./healthcheck) reports that the API process is running.
- [Course catalog](./courses) searches the training catalog.
- [Enrollment requests](./enrollment-requests) creates and reviews course enrollment requests.
- [Course catalog decision](./adr/course-catalog-search) records why the catalog is an in-memory seed.
- [Enrollment request decision](./adr/enrollment-request-workflow) records why requests stay in memory.
