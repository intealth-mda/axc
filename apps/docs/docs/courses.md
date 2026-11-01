# Courses

`GET /api/courses` searches the training course catalog. It supports keyword search, filters, pagination, and sorting.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

All query parameters are optional. Unknown parameters are ignored.

| Parameter | Type | Default | Allowed values | Rules |
| --- | --- | --- | --- | --- |
| `q` | string | none | any text | Case-insensitive substring match on `title`, `summary`, or any tag. Empty or whitespace-only is ignored. |
| `modality` | enum | none | `online`, `in-person`, `hybrid` | Exact match. |
| `status` | enum | none | `draft`, `active`, `retired` | Exact match. |
| `tag` | string | none | any tag | Case-insensitive exact match on one of the course's tags. Empty or whitespace-only is ignored. |
| `page` | integer | `1` | `1` or more | A page past the last page returns `200` with empty `items`. |
| `pageSize` | integer | `10` | `1` to `50` | |
| `sort` | enum | `title` | `title`, `createdAt`, `updatedAt` | Ascending. Ties are broken by `id` ascending. |

Filters combine with AND.

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
| `items` | The courses on the requested page. Empty when nothing matches. |
| `page` | The requested page. |
| `pageSize` | The requested page size. |
| `totalItems` | Number of courses matching the filters, across all pages. |
| `totalPages` | `ceil(totalItems / pageSize)`. `0` when nothing matches. |

No matches is not an error. It returns `200` with `"items": []`, `"totalItems": 0`, and `"totalPages": 0`.

## Error response

`400` with this JSON body:

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

`details` holds one entry per invalid parameter. All invalid parameters are reported in one response.

The request returns `400` when:

- `modality` is not `online`, `in-person`, or `hybrid`.
- `status` is not `draft`, `active`, or `retired`.
- `sort` is not `title`, `createdAt`, or `updatedAt`.
- `page` is not a whole number of at least `1` (for example `0`, `-1`, `1.5`, or `abc`).
- `pageSize` is not a whole number from `1` to `50` (for example `0`, `51`, `2.5`, or `abc`).

## Example

```bash
curl -s 'https://api.agentcourses.localhost/api/courses?q=security&modality=online&status=active'
```

The catalog is served from in-memory seed data in `@axc/application-services`. It does not use a database.
