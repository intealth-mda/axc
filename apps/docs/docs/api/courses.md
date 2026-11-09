# Course catalog API

`GET /api/courses` searches the sample training catalog. No authentication or external services are required. The catalog has 12 fixture courses, including draft and retired entries.

## Query parameters

| Parameter | Behavior |
| --- | --- |
| q | Case-insensitive substring in title, summary, or any tag |
| modality | online, in-person, hybrid |
| status | draft, active, retired |
| tag | Case-insensitive exact tag match |
| page | Positive integer, default 1 |
| pageSize | Integer 1–50, default 10 |
| sort | title (default), createdAt, updatedAt; ascending, with id as tie-breaker |

Filters combine with AND. Text is trimmed. Empty values, repeated or unknown parameters, invalid enums and invalid integers return 400. No matches or an out-of-range page returns an empty items array with accurate totals.

## Example request and response

```http
GET /api/courses?q=security&modality=online&status=active&pageSize=5
```

200 OK returns:

```json
{
  "items": [{
    "id": "course-001",
    "title": "AI Security Foundations",
    "summary": "Secure AI-assisted development",
    "modality": "online",
    "status": "active",
    "tags": ["ai", "security"],
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-06-12T00:00:00.000Z"
  }],
  "page": 1,
  "pageSize": 5,
  "totalItems": 2,
  "totalPages": 1
}
```

The example truncates items to illustrate the field shape; the actual response includes both matching courses.

## Errors

400 Bad Request uses the consistent error envelope:

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "pageSize is invalid.",
    "details": [{ "field": "pageSize", "message": "pageSize is invalid." }]
  }
}
```

Dates are ISO strings. All Course fields shown above are required. See [enrollment requests](./enrollment-requests.md) to request an active course.
