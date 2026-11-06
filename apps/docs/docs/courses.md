# Courses

`GET /api/courses` searches the training course catalog.

## Request

```http
GET /api/courses?q=security&modality=online&status=active&tag=ai&page=1&pageSize=5&sort=title
```

| Parameter | Values | Default |
| --- | --- | --- |
| `q` | Keyword; case-insensitive match on title, summary or tags | none |
| `modality` | `online`, `in-person`, `hybrid` | none |
| `status` | `draft`, `active`, `retired` | none |
| `tag` | Exact tag, case-insensitive | none |
| `page` | Integer ≥ 1 | `1` |
| `pageSize` | Integer 1–50 | `10` |
| `sort` | `title`, `createdAt`, `updatedAt` (ascending) | `title` |

## Success response

`200`. No matches give `items: []` and `totalItems: 0`.

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

`400` for an invalid `modality`, `status`, `page`, `pageSize` or `sort`. `details` lists every invalid field.

```json
{
  "error": {
    "code": "INVALID_QUERY_PARAMETER",
    "message": "One or more query parameters are invalid.",
    "details": [{ "field": "pageSize", "message": "pageSize must be between 1 and 50." }]
  }
}
```

## Example

```bash
curl 'http://localhost:7071/api/courses?tag=ai&sort=createdAt'
```

Data comes from 12 seeded in-memory courses (`packages/axc/persistence/src/course-seed.ts`).
