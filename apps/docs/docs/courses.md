# Courses

`GET /api/courses` searches the training course catalog. The catalog is a fixed in-memory fixture of 12 courses, so the route does not call external services.

## Decision

Search, filtering, pagination, and sorting run in the catalog application service. The course aggregate stays in `@axc/domain`. The fixture is stored behind a repository in `@axc/persistence`. HTTP query parsing that fails returns `400` with `INVALID_QUERY_PARAMETER`. An empty match returns `200` and an empty `items` array. Sort order is ascending and case-insensitive. `totalPages` is `0` when `totalItems` is `0`.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

```bash
curl -s "https://api.agentcourses.localhost/api/courses?q=security&modality=online&status=active"
```

## Query parameters

| Parameter | Default | Rule |
| --- | --- | --- |
| `q` | omitted | Case-insensitive substring match on `title`, `summary`, or any tag. |
| `modality` | omitted | `online`, `in-person`, or `hybrid`. |
| `status` | omitted | `draft`, `active`, or `retired`. |
| `tag` | omitted | Case-insensitive equality against one tag. |
| `page` | `1` | Integer greater than or equal to 1. |
| `pageSize` | `10` | Integer from 1 through 50. |
| `sort` | `title` | `title`, `createdAt`, or `updatedAt`. Ascending. |

Unknown parameters, duplicate parameters, and values outside those rules are invalid.

## Successful response

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
| `items` | The page of courses. Empty when nothing matches. |
| `page` | The requested page. |
| `pageSize` | The requested page size. |
| `totalItems` | Match count before paging. |
| `totalPages` | `ceil(totalItems / pageSize)`, or `0` when there are no matches. |

## Error response

Invalid query parameters return `400`:

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

`details` lists each invalid field. Field order is not significant.
