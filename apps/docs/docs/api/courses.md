# Course search

`GET /api/courses` returns a paginated fixture-backed training catalog. All filters combine with AND. No authentication or external services are required in this sample.

## Query parameters

| Parameter | Meaning | Default / allowed values |
| --- | --- | --- |
| q | Case-insensitive substring in title, summary, or any tag | Optional, non-empty |
| modality | Exact modality | online, in-person, hybrid |
| status | Exact course status | draft, active, retired |
| tag | Case-insensitive exact tag | Optional, non-empty |
| page | Positive safe integer, one-based | 1 |
| pageSize | Integer from 1 to 50 | 10 |
| sort | Ascending ordering, with ID tie-breaker | title (default), createdAt, updatedAt |

Unknown, repeated, empty, malformed, and out-of-range parameters return 400. Whitespace surrounding q and tag is trimmed. Enum values are case-sensitive.

## Request and response

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

HTTP 200:

```json
{
  "items": [
    {
      "id": "course-001",
      "title": "AI Security Foundations",
      "summary": "Introductory secure development.",
      "modality": "online",
      "status": "active",
      "tags": ["ai", "security"],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-06-12T00:00:00.000Z"
    },
    {
      "id": "course-012",
      "title": "Threat Modeling",
      "summary": "Identify risks.",
      "modality": "online",
      "status": "active",
      "tags": ["SECURITY", "ai"],
      "createdAt": "2026-01-12T00:00:00.000Z",
      "updatedAt": "2026-06-01T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 5,
  "totalItems": 2,
  "totalPages": 1
}
```

No matches produce HTTP 200 with empty items, totalItems 0, and totalPages 0. A page beyond the last page returns empty items and retains the total counts.

## Errors

| HTTP | Code | Condition |
| --- | --- | --- |
| 400 | INVALID_QUERY_PARAMETER | Invalid search query |
| 500 | INTERNAL_ERROR | Unexpected failure; internal details are concealed |

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [{"field": "pageSize", "message": "pageSize must be between 1 and 50."}]
  }
}
```
