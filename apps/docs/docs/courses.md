# Courses

`GET /api/courses` searches the training course catalog.

## Query parameters

| Name | Default | Rule |
| --- | --- | --- |
| `q` | none | Keyword; case-insensitive match on title, summary or tags. |
| `modality` | none | `online`, `in-person` or `hybrid`. |
| `status` | none | `draft`, `active` or `retired`. |
| `tag` | none | Exact tag, case-insensitive. |
| `page` | `1` | Integer, at least 1. |
| `pageSize` | `10` | Integer, 1 to 50. |
| `sort` | `title` | `title`, `createdAt` or `updatedAt` (ascending). |

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

## Success response

`200`. No match returns `200` with an empty `items` array.

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
      "updatedAt": "2026-06-28T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

## Error response

`400` with code `INVALID_QUERY_PARAMETER`, one detail per invalid field.

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
curl -s "https://api.agentcourses.localhost/api/courses?tag=ai&sort=createdAt"
```
