# Course catalog

`GET /api/courses` searches the sample training catalog. The fixture contains 12 courses with all modalities and statuses. No external service is required.

| Query parameter | Meaning | Default / allowed values |
| --- | --- | --- |
| `q` | Case-insensitive substring in title, summary, or any tag | Optional, nonblank |
| `modality` | Exact modality | `online`, `in-person`, `hybrid` |
| `status` | Exact status | `draft`, `active`, `retired` |
| `tag` | Case-insensitive exact tag | Optional, nonblank |
| `page` | Positive safe integer page number | `1` |
| `pageSize` | Integer from 1 through 50 | `10` |
| `sort` | Ascending sort field | `title` (default), `createdAt`, `updatedAt` |

Filters combine with AND. Keyword fields combine with OR. Enum values are case-sensitive. Search text preserves spaces; whitespace-only values are invalid. Sorting breaks ties by course ID. Filtering and sorting happen before pagination. Unknown or repeated query parameters are invalid. Integers accept digits only; empty parameters are invalid.

Example request:

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

HTTP 200 response:

```json
{
  "items": [
    {
      "id": "course-001",
      "title": "AI Security Foundations",
      "summary": "Introductory secure development",
      "modality": "online",
      "status": "active",
      "tags": ["ai", "security"],
      "createdAt": "2025-12-15T00:00:00.000Z",
      "updatedAt": "2026-01-20T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

Each course includes a unique string ID, title, summary, modality, status, tag array, and ISO date strings `createdAt` and `updatedAt`. `totalItems` counts all filtered courses; `totalPages` is its ceiling divided by `pageSize`. No matches return HTTP 200 with `items: []`, `totalItems: 0`, and `totalPages: 0`. A page beyond the last page returns `items: []` with the actual totals.

HTTP 400 uses the same error envelope for invalid modality, status, sort, blank search/tag, unknown/repeated parameters, and invalid pagination (including fractional, signed, exponent, unsafe, empty, or out-of-range numbers). All validation problems are returned in `details`:

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [
      { "field": "pageSize", "message": "pageSize must be between 1 and 50." }
    ]
  }
}
```

Unexpected server failures use HTTP 500. The endpoint provides a read-only process-local sample catalog; there is no database or course mutation API.
