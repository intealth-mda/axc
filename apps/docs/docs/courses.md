# Course catalog

`GET /api/courses` searches the training course catalog. The catalog is a local fixture of 14 courses. The route is anonymous, same as the healthcheck.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

| Query | Default | Rule |
| --- | --- | --- |
| `q` | omitted | Case-insensitive match against `title`, `summary`, or any tag. |
| `modality` | omitted | `online`, `in-person`, or `hybrid`. |
| `status` | omitted | `draft`, `active`, or `retired`. |
| `tag` | omitted | Case-insensitive exact tag match. |
| `page` | `1` | Integer greater than or equal to 1. |
| `pageSize` | `10` | Integer from 1 through 50. |
| `sort` | `title` | `title`, `createdAt`, or `updatedAt`. Ascending, then `id`. |

Filters combine with AND. Omitted filters are not applied.

## Success response

`200` with this JSON body:

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

| Field | Meaning |
| --- | --- |
| `items` | The courses on this page. Empty when nothing matches. |
| `page` | The requested page. |
| `pageSize` | The requested page size. |
| `totalItems` | How many courses match before paging. |
| `totalPages` | `0` when `totalItems` is 0, otherwise `ceil(totalItems / pageSize)`. |

A query that matches nothing is still `200`. `items` is `[]` and `totalItems` is `0`.

## Error response

Invalid `modality`, `status`, `page`, `pageSize`, or `sort` returns `400`:

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

When several parameters are invalid, `details` lists each field. Field order is not significant.

## Example

```bash
curl -s "https://api.agentcourses.localhost/api/courses?q=security&pageSize=5"
```

Local `pnpm run dev` publishes the API through portless at `https://api.agentcourses.localhost`.
