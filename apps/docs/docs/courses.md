---
id: courses
title: Courses
---

# Course catalog search

`GET /api/courses` searches the training course catalog. No authentication.

## Query parameters

| Name | Type | Default | Rules |
| --- | --- | --- | --- |
| `q` | string | none | Case-insensitive keyword match on title, summary or tags |
| `modality` | enum | none | `online`, `in-person`, `hybrid` |
| `status` | enum | none | `draft`, `active`, `retired` |
| `tag` | string | none | Case-insensitive exact tag match |
| `page` | integer | 1 | 1 or more |
| `pageSize` | integer | 10 | 1 to 50 |
| `sort` | enum | `title` | `title`, `createdAt`, `updatedAt` (ascending) |

Unknown parameters are ignored. No match returns 200 with empty `items`.

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

Code `INVALID_QUERY_PARAMETER`, one `details` entry per invalid field.

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

Data is an in-memory seed of 12 courses; it resets on restart.
