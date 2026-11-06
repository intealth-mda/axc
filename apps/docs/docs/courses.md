---
id: courses
title: Course catalog
---

`GET /api/courses` searches the training catalog. The sample contains 12 deterministic in-memory courses and requires no external services.

| Query parameter | Meaning | Default |
| --- | --- | --- |
| `q` | Case-insensitive substring in title, summary or any tag | Absent |
| `modality` | `online`, `in-person`, `hybrid` | All |
| `status` | `draft`, `active`, `retired` | All |
| `tag` | Case-insensitive whole tag | All |
| `page` | Positive safe integer, digits only | `1` |
| `pageSize` | Integer from 1 through 50, digits only | `10` |
| `sort` | `title`, `createdAt`, `updatedAt` | `title` |

Filters combine with AND. Whitespace surrounding `q` and `tag` is trimmed. All sorts ascend; ties use ascending id. Pagination follows filtering and sorting. A page beyond the last page returns empty items with the filtered total. No matches return 200, `items: []`, `totalItems: 0`, `totalPages: 0`.

Example: `/api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title`

HTTP 200:

```json
{
  "items": [{
    "id": "course-001",
    "title": "AI Security Foundations",
    "summary": "Introductory course on secure AI-assisted development.",
    "modality": "online",
    "status": "active",
    "tags": ["ai", "security"],
    "createdAt": "2026-01-12T00:00:00.000Z",
    "updatedAt": "2026-06-15T00:00:00.000Z"
  }],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

HTTP 400 uses `INVALID_QUERY_PARAMETER` for invalid enum values, malformed, unsafe or out-of-range integers, empty values (including whitespace-only search/tag), unknown parameters, and repeated parameters. Details collect all detected problems. Example for `?pageSize=51`:

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [{"field": "pageSize", "message": "pageSize must be between 1 and 50."}]
  }
}
```
