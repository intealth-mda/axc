# Course search

`GET /api/courses` searches the seeded training catalog. The catalog is fixed in memory for this sample and contains 12 courses. `course-001` is **AI Security Foundations**, an active online course tagged `ai` and `security`.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

| Query | Default | Rule |
| --- | --- | --- |
| `q` | none | Case-insensitive substring of `title`, `summary`, or any tag. |
| `modality` | none | `online`, `in-person`, or `hybrid`. |
| `status` | none | `draft`, `active`, or `retired`. |
| `tag` | none | Case-insensitive exact tag match. |
| `page` | `1` | Integer greater than or equal to 1. |
| `pageSize` | `10` | Integer from 1 to 50. |
| `sort` | `title` | `title`, `createdAt`, or `updatedAt`. Ascending, then `id`. |

Filters combine with AND. Unknown query keys are ignored. No matches return `200` and an empty `items` array.

## Success response

`200`

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

## Error response

`400` when `modality`, `status`, `page`, `pageSize`, or `sort` is invalid.

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

Enrollment requests for an active course are documented in [Enrollment requests](./enrollment-requests).
