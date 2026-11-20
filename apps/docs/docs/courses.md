---
id: courses
title: Courses
---

# Courses

`GET /api/courses` searches the course catalog.

## Query parameters

| name | type | default | rule |
| --- | --- | --- | --- |
| `q` | string | none | case-insensitive match on title, summary or tags |
| `modality` | enum | none | `online`, `in-person`, `hybrid` |
| `status` | enum | none | `draft`, `active`, `retired` |
| `tag` | string | none | case-insensitive tag match |
| `page` | integer | 1 | at least 1 |
| `pageSize` | integer | 10 | 1 to 50 |
| `sort` | enum | `title` | `title`, `createdAt`, `updatedAt` (ascending) |

## Success (200)

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
      "updatedAt": "2026-06-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

No match returns 200 with an empty `items` array.

## Error (400)

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
curl "http://localhost:7071/api/courses?q=security&status=active&pageSize=5"
```
