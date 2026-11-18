# Courses

`GET /api/courses` searches the course catalog.

## Query parameters

| name | default | rule |
| --- | --- | --- |
| `q` | none | case-insensitive match on title, summary or tags |
| `modality` | none | `online`, `in-person`, `hybrid` |
| `status` | none | `draft`, `active`, `retired` |
| `tag` | none | case-insensitive exact tag |
| `page` | `1` | integer, 1 or more |
| `pageSize` | `10` | integer, 1 to 50 |
| `sort` | `title` | `title`, `createdAt`, `updatedAt` (ascending) |

## Response

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

No match returns `200` with empty `items`.

## Errors

Invalid parameters return `400`:

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
curl 'http://localhost:7071/api/courses?q=security&status=active&pageSize=5'
```
