---
id: courses
title: Course catalog
---

# Course catalog

`GET /api/courses` searches the training course catalog. Anonymous; data is an in-memory seed of 13 courses.

## Query parameters

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `q` | string | — | Case-insensitive substring of title, summary, or any tag |
| `modality` | enum | — | `online`, `in-person`, `hybrid` |
| `status` | enum | — | `draft`, `active`, `retired` |
| `tag` | string | — | Case-insensitive exact tag match |
| `page` | integer | `1` | ≥ 1 |
| `pageSize` | integer | `10` | 1–50 |
| `sort` | enum | `title` | `title`, `createdAt`, `updatedAt` (ascending) |

Unknown parameters are ignored. No match returns 200 with `items: []`.

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
      "createdAt": "2026-01-15T00:00:00.000Z",
      "updatedAt": "2026-06-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

## Error response (400)

Every invalid parameter is listed in `details`.

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
curl 'http://localhost:7071/api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title'
```
