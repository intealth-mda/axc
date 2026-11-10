# Course catalog

`GET /api/courses` searches the training course catalog served by `@apps/api`.

The sample catalog is an in-memory fixture of 12 courses. Each request reads that fixture. No external service or production data is required.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

| Query | Default | Rule |
| --- | --- | --- |
| `q` | omitted | Case-insensitive substring match against `title`, `summary`, or any tag. |
| `modality` | omitted | `online`, `in-person`, or `hybrid`. |
| `status` | omitted | `draft`, `active`, or `retired`. |
| `tag` | omitted | Case-insensitive exact tag match. |
| `page` | `1` | Integer greater than or equal to 1. |
| `pageSize` | `10` | Integer from 1 through 50. |
| `sort` | `title` | `title`, `createdAt`, or `updatedAt`. Ascending. |

Filters combine with and. Enum values are lowercase. `q` and `tag` ignore case. A query parameter may appear once. Unknown query parameters are rejected.

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
| `items` | Courses on this page. Empty when nothing matches. |
| `page` | Requested page, after the default is applied. |
| `pageSize` | Requested page size, after the default is applied. |
| `totalItems` | Match count before paging. |
| `totalPages` | `0` when there are no matches. Otherwise `totalItems` divided by `pageSize`, rounded up. |

A request that matches nothing returns `200` and an empty `items` array.

## Error response

Invalid `modality`, `status`, `page`, `pageSize`, `sort`, repeated parameters, or unknown parameters return `400`:

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

`details` contains one entry per invalid field. When several parameters are invalid, every field is listed.

## Example

```bash
curl -s 'https://api.agentcourses.localhost/api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title'
```

Local `pnpm run dev` publishes the API through portless at `https://api.agentcourses.localhost`. A git worktree named `feature-a` uses `https://api.agentcourses.feature-a.localhost` when `WORKTREE_NAME=feature-a`.

## Decision

The catalog is a read model. Fixture rows live in `@axc/persistence` and are rehydrated as `Course` aggregates per request. Search, filters, sort, and paging run over that fixture. Query validation lives in the course application service so HTTP 400 uses one error body. The route does not call an external catalog.
