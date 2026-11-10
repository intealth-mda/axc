---
id: courses
title: Courses
---

# Course search

`GET /api/courses`

| Query | Allowed values | Default |
| --- | --- | --- |
| `q` | keyword; matches title, summary or tags, case-insensitive | — |
| `modality` | `online`, `in-person`, `hybrid` | — |
| `status` | `draft`, `active`, `retired` | — |
| `tag` | tag name, case-insensitive | — |
| `page` | integer ≥ 1 | `1` |
| `pageSize` | integer 1–50 | `10` |
| `sort` | `title`, `createdAt`, `updatedAt` (ascending) | `title` |

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
      "updatedAt": "2026-06-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 10,
  "totalItems": 1,
  "totalPages": 1
}
```

No match returns 200 with `items: []`.

## 400 response

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [{ "field": "pageSize", "message": "pageSize must be between 1 and 50." }]
  }
}
```

```bash
curl 'http://localhost:7071/api/courses?q=security&modality=online&status=active&page=1&pageSize=5&sort=title'
```
