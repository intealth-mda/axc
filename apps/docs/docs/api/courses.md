# Course catalog

`GET /api/courses` returns one page of training courses from the in-memory catalog. Filters combine with AND. Keyword search and the tag filter are case-insensitive. Sort is ascending.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

## Query parameters

| Name | Default | Rule |
| --- | --- | --- |
| `q` | none | Substring match on title, summary, or tags. Case-insensitive. |
| `modality` | none | `online`, `in-person`, or `hybrid`. |
| `status` | none | `draft`, `active`, or `retired`. |
| `tag` | none | Exact tag match. Case-insensitive. |
| `page` | `1` | Integer greater than or equal to 1. |
| `pageSize` | `10` | Integer from 1 through 50. |
| `sort` | `title` | `title`, `createdAt`, or `updatedAt`. |

Unknown query parameters are ignored. An omitted filter does not restrict that field.

## Success response

`200`

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
| `items` | Courses on this page. Empty when nothing matches or the page is past the end. |
| `page` | Requested page. |
| `pageSize` | Requested page size. |
| `totalItems` | Match count before paging. |
| `totalPages` | `0` when `totalItems` is 0. Otherwise `ceil(totalItems / pageSize)`. |

No matches return `200` with `items: []`. They do not return an error.

## Error response

Invalid `modality`, `status`, `page`, `pageSize`, or `sort` returns `400`.

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

Local `pnpm run dev` publishes the API through portless at `https://api.agentcourses.localhost`. A git worktree named `feature-a` uses `https://api.agentcourses.feature-a.localhost` when `WORKTREE_NAME=feature-a`.
