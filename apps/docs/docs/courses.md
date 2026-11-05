---
id: courses
title: Courses
---

# Course catalog search

`GET /api/courses` — search, filter, sort and paginate the course catalog. Anonymous.

## Query parameters

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `q` | string | — | Case-insensitive substring match on title, summary or tags |
| `modality` | enum | — | `online`, `in-person`, `hybrid` |
| `status` | enum | — | `draft`, `active`, `retired` |
| `tag` | string | — | Case-insensitive exact tag match |
| `page` | integer | `1` | ≥ 1 |
| `pageSize` | integer | `10` | 1–50 |
| `sort` | enum | `title` | `title`, `createdAt`, `updatedAt` (ascending) |

## Success response (200)

```json
{
  "items": [
    {
      "id": "course-001",
      "title": "AI Security Foundations",
      "summary": "Introductory course on secure AI-assisted development.",
      "modality": "online",
      "status": "active",
      "tags": ["ai", "security"],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-07-12T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "totalItems": 1,
  "totalPages": 1
}
```

No matches returns 200 with `"items": []` and `totalItems: 0`.

## Error response (400)

Any invalid `modality`, `status`, `page`, `pageSize` or `sort` returns code `INVALID_QUERY_PARAMETER`, one `details` entry per bad field:

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [{ "field": "pageSize", "message": "pageSize must be between 1 and 50." }]
  }
}
```

## Example

```bash
curl "http://localhost:7071/api/courses?q=security&modality=online&status=active&page=1&pageSize=5&sort=title"
```

Data is an in-memory seed of 12 courses (`packages/axc/persistence/src/course.seed.ts`).
