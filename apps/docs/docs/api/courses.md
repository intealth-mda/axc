---
title: Courses
---

# Courses

`GET /api/courses` searches the training catalog. The catalog is seeded in the API process. Filtering, sorting, and pagination happen in memory.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

| Query | Default | Rule |
| --- | --- | --- |
| `q` | none | Case-insensitive match against title, summary, or any tag. Empty means no keyword filter. |
| `modality` | none | `online`, `in-person`, or `hybrid`. |
| `status` | none | `draft`, `active`, or `retired`. |
| `tag` | none | Case-insensitive exact tag match. Empty means no tag filter. |
| `page` | `1` | Integer greater than or equal to 1. |
| `pageSize` | `10` | Integer from 1 through 50. |
| `sort` | `title` | `title`, `createdAt`, or `updatedAt`. Ascending. Ties break on `id`. |

Any other query parameter is rejected. A page past the end returns an empty `items` array and HTTP 200.

## Success

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

No matches still return `200`. `items` is `[]`, `totalItems` is `0`, and `totalPages` is `0`.

| Field | Meaning |
| --- | --- |
| `id` | Stable course id. |
| `title` | Course title. |
| `summary` | Short description. |
| `modality` | `online`, `in-person`, or `hybrid`. |
| `status` | `draft`, `active`, or `retired`. |
| `tags` | Searchable tags. |
| `createdAt` | ISO-8601 creation time. |
| `updatedAt` | ISO-8601 update time. |
| `page` | Requested page, or `1` when omitted. |
| `pageSize` | Requested page size, or `10` when omitted. |
| `totalItems` | Match count before paging. |
| `totalPages` | `0` when there are no matches, otherwise `ceil(totalItems / pageSize)`. |

The seed contains 12 courses. `course-001` is the active online course in the example above.

## Error

Invalid query parameters return `400`.

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

| Invalid value | Detail |
| --- | --- |
| `modality` outside `online`, `in-person`, `hybrid` | `modality must be online, in-person, or hybrid.` |
| `status` outside `draft`, `active`, `retired` | `status must be draft, active, or retired.` |
| `page` not an integer greater than or equal to 1 | `page must be an integer greater than or equal to 1.` |
| `pageSize` outside 1 through 50 | `pageSize must be between 1 and 50.` |
| `sort` outside `title`, `createdAt`, `updatedAt` | `sort must be title, createdAt, or updatedAt.` |
| Any other parameter | `<field> is not a supported query parameter.` |

## Example

```bash
curl -s "https://api.agentcourses.localhost/api/courses?q=security&modality=online&status=active"
```
