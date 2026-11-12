# Courses

`GET /api/courses` searches the course catalog.

## Query parameters

| Name | Allowed values | Default |
| --- | --- | --- |
| `q` | keyword; matches title, summary or tags, case-insensitive | none |
| `modality` | `online`, `in-person`, `hybrid` | none |
| `status` | `draft`, `active`, `retired` | none |
| `tag` | tag, case-insensitive | none |
| `page` | integer 1 or more | `1` |
| `pageSize` | integer 1 to 50 | `10` |
| `sort` | `title`, `createdAt`, `updatedAt` (ascending) | `title` |

## Response

`200`:

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

No match returns `200` with an empty `items` array.

## Errors

`400` with code `INVALID_QUERY_PARAMETER`:

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
