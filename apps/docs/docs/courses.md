# Course catalog

`GET /api/courses` searches the sample training catalog. The API process serves a seeded in-memory catalog of 15 courses, so the endpoint runs without an external database.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

| Query parameter | Default | Rule |
| --- | --- | --- |
| `q` | omitted | Case-insensitive substring match against `title`, `summary`, and `tags`. A blank value is ignored. |
| `modality` | omitted | `online`, `in-person`, or `hybrid`. |
| `status` | omitted | `draft`, `active`, or `retired`. |
| `tag` | omitted | Case-insensitive exact tag match. |
| `page` | `1` | Integer greater than or equal to 1. |
| `pageSize` | `10` | Integer from 1 through 50. |
| `sort` | `title` | `title`, `createdAt`, or `updatedAt`. Sort order is ascending. Equal values are ordered by `id`. |

Filters combine with AND. Enum values are case-sensitive. Each parameter may be sent once. Any other query parameter is invalid.

A page past the last page is a successful empty page. `totalPages` is `0` when no course matches.

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
| `items` | Courses on this page. |
| `page` | Requested page number. |
| `pageSize` | Requested page size. |
| `totalItems` | Courses that match before pagination. |
| `totalPages` | Pages needed for `totalItems` at this `pageSize`. |

| Course field | Meaning |
| --- | --- |
| `id` | Stable course id. |
| `title` | Course title. |
| `summary` | Short description. |
| `modality` | `online`, `in-person`, or `hybrid`. |
| `status` | `draft`, `active`, or `retired`. |
| `tags` | Searchable tags. |
| `createdAt` | ISO-8601 UTC timestamp. |
| `updatedAt` | ISO-8601 UTC timestamp. |

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

`details` lists every invalid field on the request.

## Example

```bash
curl -s "https://api.agentcourses.localhost/api/courses?q=security&modality=online&status=active"
```

Local `pnpm run dev` publishes the API through portless at `https://api.agentcourses.localhost`.

The storage choice is recorded in [Use an in-memory course catalog](./decisions/0001-course-catalog-search.md).
