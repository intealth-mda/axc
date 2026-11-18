# Courses

`GET /api/courses` searches the training course catalog (seeded in memory with 12 courses).

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `q` | string | none | Case-insensitive keyword matched against title, summary and tags |
| `modality` | enum | none | `online`, `in-person`, `hybrid` |
| `status` | enum | none | `draft`, `active`, `retired` |
| `tag` | string | none | Case-insensitive exact tag match |
| `page` | integer | `1` | 1 or greater |
| `pageSize` | integer | `10` | 1 to 50 |
| `sort` | enum | `title` | `title`, `createdAt`, `updatedAt` (ascending) |

## Success response

`200`. No matches return an empty `items` array, not an error.

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

## Error response

`400` with code `INVALID_QUERY_PARAMETER` when `modality`, `status`, `page`, `pageSize` or `sort` is invalid. `details` lists every invalid field.

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
curl "http://localhost:7071/api/courses?tag=ai&sort=createdAt"
```
