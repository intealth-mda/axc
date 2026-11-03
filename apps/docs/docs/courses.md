---
id: courses
title: Course search
---

# `GET /api/courses`

Search the course catalog.

## Query parameters

| Name | Allowed values | Default |
| --- | --- | --- |
| `q` | any text; case-insensitive match on title, summary or tags | none |
| `modality` | `online`, `in-person`, `hybrid` | none |
| `status` | `draft`, `active`, `retired` | none |
| `tag` | any tag, case-insensitive exact match | none |
| `page` | integer ≥ 1 | `1` |
| `pageSize` | integer 1–50 | `10` |
| `sort` | `title`, `createdAt`, `updatedAt` (ascending) | `title` |

## Success response — 200

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

No match returns 200 with `"items": []`.

## Error response — 400

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
curl 'http://localhost:7071/api/courses?q=security&status=active&sort=createdAt'
```
