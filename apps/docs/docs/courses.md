# Course catalog

`GET /api/courses` searches the training course catalog exposed by `@apps/api`.

The sample API serves 12 fixture courses from memory. No external catalog service is called.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

| Query | Default | Rule |
| --- | --- | --- |
| `q` | omitted | Case-insensitive substring of `title`, `summary`, or any tag. Blank values are ignored. |
| `modality` | omitted | `online`, `in-person`, or `hybrid`. |
| `status` | omitted | `draft`, `active`, or `retired`. |
| `tag` | omitted | Case-insensitive match of a whole tag. Blank values are ignored. |
| `page` | `1` | Integer greater than or equal to 1. |
| `pageSize` | `10` | Integer from 1 through 50. |
| `sort` | `title` | `title`, `createdAt`, or `updatedAt`. Order is ascending. `id` breaks ties. |

Enum and sort values are case-sensitive. Leading and trailing whitespace is removed before validation. Unknown query parameters are ignored.

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
| `page` | Requested page, after the default is applied. |
| `pageSize` | Requested page size, after the default is applied. |
| `totalItems` | Courses that match before pagination. |
| `totalPages` | `0` when `totalItems` is `0`. Otherwise `ceil(totalItems / pageSize)`. |

A query that matches nothing is still `200`. `items` is `[]`, `totalItems` is `0`, and `totalPages` is `0`.

A page past the last page is `200` with `items` set to `[]` and the same `totalItems` count.

## Error response

Invalid `modality`, `status`, `page`, `pageSize`, or `sort` values return `400`:

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

When several parameters are invalid, `details` lists each field. Field order is `modality`, `status`, `page`, `pageSize`, then `sort`.

| Field | Message |
| --- | --- |
| `modality` | `modality must be one of online, in-person, hybrid.` |
| `status` | `status must be one of draft, active, retired.` |
| `page` | `page must be an integer greater than or equal to 1.` |
| `pageSize` | `pageSize must be between 1 and 50.` |
| `sort` | `sort must be one of title, createdAt, updatedAt.` |

## Example

```bash
curl -s "https://api.agentcourses.localhost/api/courses?q=security&pageSize=5"
```

Local `pnpm run dev` publishes the API through portless at `https://api.agentcourses.localhost`. A git worktree named `feature-a` uses `https://api.agentcourses.feature-a.localhost` when `WORKTREE_NAME=feature-a`.
