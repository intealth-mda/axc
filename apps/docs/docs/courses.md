# Courses

`GET /api/courses` searches the course catalog.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

| Parameter | Rule |
| --- | --- |
| `q` | Case-insensitive keyword matched against title, summary and tags. |
| `modality` | `online`, `in-person` or `hybrid`. |
| `status` | `draft`, `active` or `retired`. |
| `tag` | Case-insensitive exact tag match. |
| `page` | Integer ≥ 1. Default `1`. |
| `pageSize` | Integer 1–50. Default `10`. |
| `sort` | `title` (default), `createdAt` or `updatedAt`, ascending. |

## Response

`200`, also when nothing matches (`items: []`):

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
      "updatedAt": "2026-06-12T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

## Errors

`400` with code `INVALID_QUERY_PARAMETER` for an invalid `modality`, `status`, `page`, `pageSize` or `sort`:

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
curl "http://localhost:7071/api/courses?tag=ai&sort=createdAt"
```
