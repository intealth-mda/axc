# Course catalog search

`GET /api/courses` searches, filters, sorts, and pages the course catalog.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

All query parameters are optional. If a parameter is repeated, the first value is used.

| Parameter | Default | Rules |
| --- | --- | --- |
| `q` | none | Trimmed. Empty means no filter. Case-insensitive substring match against the title, the summary, or any tag. |
| `modality` | none | One of `online`, `in-person`, `hybrid` (case-sensitive). An empty value is invalid. |
| `status` | none | One of `draft`, `active`, `retired` (case-sensitive). An empty value is invalid. |
| `tag` | none | Trimmed. Empty means no filter. Case-insensitive exact match against any tag. |
| `page` | `1` | Digits only, a positive safe integer: from `1` to `9007199254740991` (`Number.MAX_SAFE_INTEGER`). |
| `pageSize` | `10` | Digits only, integer from `1` to `50`. |
| `sort` | `title` | One of `title`, `createdAt`, `updatedAt` (case-sensitive). Always ascending. `title` sorts case-insensitively; ties are broken by `id`. An empty value is invalid. |

Filters combine with AND.

## Response

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
| `items` | The courses on the requested page. |
| `page` | The requested page number. |
| `pageSize` | The requested page size. |
| `totalItems` | Number of courses that match the filters, across all pages. |
| `totalPages` | `ceil(totalItems / pageSize)`, or `0` when nothing matches. |

## Errors

`400` when one or more query parameters are invalid. Every invalid parameter is listed in `details`, in the order `modality`, `status`, `page`, `pageSize`, `sort`. `q` and `tag` are never invalid.

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [
      { "field": "pageSize", "message": "pageSize must be between 1 and 50." }
    ]
  }
}
```

| Field | Message |
| --- | --- |
| `modality` | `modality must be one of: online, in-person, hybrid.` |
| `status` | `status must be one of: draft, active, retired.` |
| `page` | `page must be a positive integer.` |
| `pageSize` | `pageSize must be between 1 and 50.` |
| `sort` | `sort must be one of: title, createdAt, updatedAt.` |

## Example

```bash
curl -s 'https://api.agentcourses.localhost/api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title'
```

## Notes

- A search with no matches returns `200` with an empty `items` array, not an error.
- A `page` past the last page returns `200` with an empty `items` array.
- Unknown query parameters are ignored.
- The catalog is an in-memory fixture of sample courses. There is no database yet.
