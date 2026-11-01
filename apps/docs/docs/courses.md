# Courses

`GET /api/courses` searches the training course catalog by keyword and filters the results by modality, status, and tag.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

All query parameters are optional.

| Parameter | Allowed values | Default | Behavior |
| --- | --- | --- | --- |
| `q` | Any text | None | Trimmed. Matches courses whose title, summary, or any tag contains the text, ignoring case. Empty means no keyword filter. |
| `modality` | `online`, `in-person`, `hybrid` | None | Returns only courses with this modality. |
| `status` | `draft`, `active`, `retired` | None | Returns only courses with this status. |
| `tag` | Any non-empty text | None | Returns only courses with a tag equal to this value, ignoring case. |
| `page` | Integer, 1 or more | `1` | Page number to return. |
| `pageSize` | Integer, 1 to 50 | `10` | Maximum number of items per page. |
| `sort` | `title`, `createdAt`, `updatedAt` | `title` | Ascending sort field. Ties are ordered by `id`. |

Filters combine with AND. Unknown query parameters are ignored.

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
| `items` | Courses on the requested page. Empty when nothing matches or the page is past the end. |
| `page` | The page returned. |
| `pageSize` | The page size used. |
| `totalItems` | Number of courses matching the filters, across all pages. |
| `totalPages` | `ceil(totalItems / pageSize)`, or `0` when nothing matches. |

No matches is not an error: the response is `200` with an empty `items` array.

## Errors

`400` when any query parameter is invalid. Every invalid parameter gets one entry in `details`:

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

A parameter is invalid when:

- `modality`, `status`, or `sort` is not one of its allowed values (they are case-sensitive, and an empty value is invalid).
- `tag` is empty.
- `page` is not a whole number of 1 or more.
- `pageSize` is not a whole number from 1 to 50.

## Example

```bash
curl -s 'https://api.agentcourses.localhost/api/courses?q=security&modality=online&status=active&pageSize=5'
```

Courses are served from an in-memory seed catalog; there is no persistence yet.
