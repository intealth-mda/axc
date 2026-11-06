---
id: courses
title: Courses
---

# Course search

`GET /api/courses` searches the seeded course catalog (12 in-memory courses).

## Query parameters

| Name | Allowed values | Default | Notes |
| --- | --- | --- | --- |
| `q` | any text | — | Case-insensitive match on title, summary or tags |
| `modality` | `online`, `in-person`, `hybrid` | — | |
| `status` | `draft`, `active`, `retired` | — | |
| `tag` | any text | — | Case-insensitive exact tag match |
| `page` | integer ≥ 1 | `1` | |
| `pageSize` | integer 1–50 | `10` | |
| `sort` | `title`, `createdAt`, `updatedAt` | `title` | Ascending |

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
      "createdAt": "2026-01-15T00:00:00.000Z",
      "updatedAt": "2026-06-15T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

No matches return `200` with `"items": []`.

## 400 response

Any invalid parameter returns `INVALID_QUERY_PARAMETER`, one `details` entry per bad field:

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [{ "field": "pageSize", "message": "pageSize must be between 1 and 50." }]
  }
}
```
