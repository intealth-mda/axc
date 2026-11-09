# Course catalog search

`GET /api/courses` searches the fixture-backed training catalog. No external service is required.

## Query parameters

All parameters are optional and may appear once. Filters combine with AND.

| Parameter | Values and behavior | Default |
| --- | --- | --- |
| q | Case-insensitive literal substring in title, summary, or any tag; empty matches all | none |
| modality | online, in-person, hybrid; case-sensitive | none |
| status | draft, active, retired; case-sensitive | none |
| tag | Case-insensitive exact tag; empty matches all | none |
| page | Positive safe integer in decimal digits | 1 |
| pageSize | Integer from 1 to 50 | 10 |
| sort | title, createdAt, updatedAt | title |

Sorting is ascending, with ID as the tie-breaker. Pagination follows filtering and sorting. Unknown parameters, duplicates, malformed numbers, and invalid enum values return 400. Whitespace is significant in text searches.

## Success response

For `GET /api/courses?q=security&modality=online&status=active&tag=ai&pageSize=5`:

```json
{
  "items": [{
    "id": "course-001",
    "title": "AI Security Foundations",
    "summary": "Secure AI-assisted development.",
    "modality": "online",
    "status": "active",
    "tags": ["ai", "security"],
    "createdAt": "2026-12-01T00:00:00.000Z",
    "updatedAt": "2027-01-01T00:00:00.000Z"
  }],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

HTTP 200 includes every Course field. No matches return empty items, totalItems 0, and totalPages 0. A page beyond the last returns empty items with the matching total unchanged.

## Error response

`GET /api/courses?pageSize=51` returns HTTP 400:

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [{ "field": "pageSize", "message": "pageSize must be between 1 and 50." }]
  }
}
```

## Storage and scope

Twelve deterministic fixtures cover all modalities and statuses. Course is a domain aggregate; the application queries an injected read repository. A disconnected Mongoose model validates fixture storage shape. There is no database connection, write endpoint, or durable storage. Future course commands require mutation repositories and units of work.
