---
id: courses
title: Courses
---

# Courses

`GET /api/courses` searches the training course catalog. Seeded in memory with 12 courses.

## Query parameters

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `q` | string | none | Case-insensitive substring of title, summary or any tag |
| `modality` | enum | none | `online`, `in-person`, `hybrid` |
| `status` | enum | none | `draft`, `active`, `retired` |
| `tag` | string | none | Case-insensitive exact tag match |
| `page` | integer | 1 | 1 or greater |
| `pageSize` | integer | 10 | 1 to 50 |
| `sort` | enum | `title` | `title`, `createdAt`, `updatedAt` (ascending) |

Filters combine with AND. No match returns 200 with empty `items`.

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
      "createdAt": "2026-06-15T00:00:00.000Z",
      "updatedAt": "2026-07-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

## Error response (400)

Any invalid parameter returns code `INVALID_QUERY_PARAMETER`, one `details` entry per bad field.

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
