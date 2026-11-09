---
id: courses
title: Course search
---

# `GET /api/courses`

Searches the course catalog (12 seeded courses, in-memory).

| Query param | Values | Default |
| --- | --- | --- |
| `q` | keyword; case-insensitive match on title, summary or tags | — |
| `modality` | `online`, `in-person`, `hybrid` | — |
| `status` | `draft`, `active`, `retired` | — |
| `tag` | tag, case-insensitive exact match | — |
| `page` | integer ≥ 1 | `1` |
| `pageSize` | integer 1–50 | `10` |
| `sort` | `title`, `createdAt`, `updatedAt` (ascending) | `title` |

```bash
curl 'http://localhost:7071/api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title'
```

## 200 response

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
      "createdAt": "2025-01-15T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

No match returns 200 with `"items": []`.

## 400 response

Any invalid `modality`, `status`, `page`, `pageSize` or `sort`:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request could not be completed.",
    "details": [{ "field": "pageSize", "message": "pageSize must be between 1 and 50." }]
  }
}
```
