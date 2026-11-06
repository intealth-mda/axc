---
id: courses
title: Course catalog
---

`GET /api/courses` searches the sample training catalog. All filters combine with AND.

| Query parameter | Behavior / default |
| --- | --- |
| `q` | Case insensitive substring in title, summary or any tag |
| `modality` | `online`, `in-person`, `hybrid` |
| `status` | `draft`, `active`, `retired` |
| `tag` | Case insensitive exact tag |
| `page` | Positive safe integer, default `1` |
| `pageSize` | Integer from `1` to `50`, default `10` |
| `sort` | `title` (default), `createdAt`, `updatedAt` |

Sort is ascending with id as the tie breaker. Filtering and sorting precede pagination.
Enums are case sensitive. Present but empty parameters are invalid; whitespace-only
`q` and `tag` are invalid. Integer parameters accept decimal digits only. Text is
matched literally without trimming. Unknown parameters are ignored; for repeated
parameters the first value is used.

Example: `/api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title`

HTTP 200:

```json
{
  "items": [{
    "id": "course-001",
    "title": "AI Security Foundations",
    "summary": "Introductory course on secure AI-assisted development.",
    "modality": "online",
    "status": "active",
    "tags": ["ai", "security"],
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-06-12T00:00:00.000Z"
  }],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

No matches return HTTP 200 with `items: []`, `totalItems: 0`, `totalPages: 0`.
Pages beyond the end return an empty array with the requested pagination and the
actual totals. Each course includes all eight fields shown above; timestamps are ISO strings.

Invalid modality, status, sort, page, pageSize, or empty q/tag return HTTP 400:

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [{"field": "pageSize", "message": "pageSize must be between 1 and 50."}]
  }
}
```

`details` lists every invalid field. Unexpected server failures use HTTP 500.
The catalog has twelve fixed in-memory courses and needs no external services.
