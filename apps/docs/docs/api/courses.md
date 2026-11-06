---
title: Course search
---

# Course search

`GET /api/courses` searches the sample catalog. Responses are JSON; no authentication is added by this sample.

| Query parameter | Meaning | Default / allowed values |
| --- | --- | --- |
| `q` | Case-insensitive substring in title, summary, or any tag | Omitted to search all |
| `modality` | Exact modality | `online`, `in-person`, `hybrid` |
| `status` | Exact status | `draft`, `active`, `retired` |
| `tag` | Case-insensitive whole-tag match | Omitted for any tag |
| `page` | Positive safe integer | `1` |
| `pageSize` | Integer from 1 to 50 | `10` |
| `sort` | Ascending sort; course ID breaks ties | `title` (default), `createdAt`, `updatedAt` |

Filters combine with AND. Text search and tag values are trimmed. Present but empty parameters are invalid. Page values must contain digits only; fractional, signed, exponential, and unsafe integer values return 400. Unknown query keys are ignored. No status filter means all statuses.

Example: `GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title`.

Success: **200**, with pagination metadata, including when there are no matches (`items: []`, `totalItems: 0`, `totalPages: 0`). A page beyond the last page also returns an empty list, retaining the matching total.

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
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-06-12T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

Invalid enums, blank filters, malformed pagination, or out-of-range pagination return **400** with code `INVALID_QUERY_PARAMETER`. The details array includes every invalid field.

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [{ "field": "pageSize", "message": "pageSize must be between 1 and 50." }]
  }
}
```

The catalog contains twelve deterministic fixtures across all modalities and statuses; see the [storage decision](../decisions/0001-in-memory-training.md).
