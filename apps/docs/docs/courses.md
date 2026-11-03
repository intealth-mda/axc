# Course catalog

`GET /api/courses` searches the training catalog composed by `@apps/api`.

Filters combine with AND. Keyword and tag matching are case-insensitive. Sort is ascending by UTF-16 code units, then `id`. An empty catalog page is `200` with `items: []` and `totalPages: 0`.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

| Query | Default | Allowed values |
| --- | --- | --- |
| `q` | omitted | Substring of `title`, `summary`, or any tag |
| `modality` | omitted | `online`, `in-person`, `hybrid` |
| `status` | omitted | `draft`, `active`, `retired` |
| `tag` | omitted | Exact tag match |
| `page` | `1` | Integer greater than or equal to 1 |
| `pageSize` | `10` | Integer from 1 to 50 |
| `sort` | `title` | `title`, `createdAt`, `updatedAt` |

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
| `items` | Courses on this page. |
| `page` | Page number that was applied. |
| `pageSize` | Page size that was applied. |
| `totalItems` | Match count before paging. |
| `totalPages` | `0` when nothing matches. Otherwise `totalItems` divided by `pageSize`, rounded up. |

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

## Example

```bash
curl -s "https://api.agentcourses.localhost/api/courses?q=security&pageSize=5"
```
