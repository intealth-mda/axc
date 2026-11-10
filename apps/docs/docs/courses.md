# Course catalog

`GET /api/courses` searches the training course catalog. The catalog is a local fixture of 12 courses, so the route does not call an external service.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

```bash
curl -s "https://api.agentcourses.localhost/api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title"
```

Local `pnpm run dev` publishes the API through portless at `https://api.agentcourses.localhost`. A git worktree named `feature-a` uses `https://api.agentcourses.feature-a.localhost` when `WORKTREE_NAME=feature-a`.

## Query parameters

| Parameter | Default | Rule |
| --- | --- | --- |
| `q` | omitted | Case-insensitive substring match against `title`, `summary`, or any tag. A blank value is ignored. |
| `modality` | omitted | `online`, `in-person`, or `hybrid`. |
| `status` | omitted | `draft`, `active`, or `retired`. |
| `tag` | omitted | Case-insensitive exact tag match. A blank value is invalid. |
| `page` | `1` | Integer greater than or equal to 1. |
| `pageSize` | `10` | Integer from 1 through 50. |
| `sort` | `title` | `title`, `createdAt`, or `updatedAt`. Ascending. |

Filters combine with AND. Unknown query keys are ignored.

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
| `items` | The page of matching courses. Empty when nothing matches. |
| `page` | The requested page. |
| `pageSize` | The requested page size after defaults. |
| `totalItems` | Match count before paging. |
| `totalPages` | `0` when there are no matches, otherwise `ceil(totalItems / pageSize)`. |

A request that matches nothing is still `200`:

```json
{
  "items": [],
  "page": 1,
  "pageSize": 10,
  "totalItems": 0,
  "totalPages": 0
}
```

## Error response

Invalid `modality`, `status`, `tag`, `page`, `pageSize`, or `sort` returns `400`. Every invalid field is listed. Field order is not significant.

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

| Field | Meaning |
| --- | --- |
| `error.code` | Always `INVALID_QUERY_PARAMETER` for a bad query. |
| `error.message` | Always `One or more query parameters are invalid.` |
| `error.details` | One entry per invalid field. |
| `error.details[].field` | The query parameter name. |
| `error.details[].message` | Why that value was rejected. |

## Course fields

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | Stable course id. |
| `title` | string | Display title. Keyword search includes this field. |
| `summary` | string | Short description. Keyword search includes this field. |
| `modality` | `online` \| `in-person` \| `hybrid` | Delivery mode. |
| `status` | `draft` \| `active` \| `retired` | Lifecycle. |
| `tags` | string[] | Keyword search and the `tag` filter use this field. |
| `createdAt` | string | ISO-8601 timestamp. |
| `updatedAt` | string | ISO-8601 timestamp. |
