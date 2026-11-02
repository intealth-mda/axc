# Course catalog

`GET /api/courses` returns a page of training courses. Keyword search matches `title`, `summary`, and `tags` without regard to case. Filters combine with the keyword.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

| Query | Default | Values |
| --- | --- | --- |
| `q` | omitted | Case-insensitive text matched against title, summary, and tags |
| `modality` | omitted | `online`, `in-person`, `hybrid` |
| `status` | omitted | `draft`, `active`, `retired` |
| `tag` | omitted | Case-insensitive tag contained by the course |
| `page` | `1` | Integer greater than or equal to 1 |
| `pageSize` | `10` | Integer from 1 through 50 |
| `sort` | `title` | `title`, `createdAt`, `updatedAt` |

## Success response

`200` with this JSON body:

```json
{
  "items": [
    {
      "id": "000000000000000000000001",
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

A query that matches nothing is still `200`. `items` is an empty array and `totalItems` is `0`.

## Error response

An invalid query parameter is `400`:

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [
      {
        "field": "pageSize",
        "message": "pageSize must be between 1 and 50."
      }
    ]
  }
}
```

## Example

```bash
curl -s "https://api.agentcourses.localhost/api/courses?q=security&pageSize=5"
```
