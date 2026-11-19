# Courses

`GET /api/courses` searches the training course catalog.

## Query parameters

| Name | Values | Default |
| --- | --- | --- |
| `q` | keyword; case-insensitive match on title, summary or tags | none |
| `modality` | `online`, `in-person`, `hybrid` | none |
| `status` | `draft`, `active`, `retired` | none |
| `tag` | exact tag, case-insensitive | none |
| `page` | integer 1 or more | `1` |
| `pageSize` | integer 1 to 50 | `10` |
| `sort` | `title`, `createdAt`, `updatedAt` (ascending) | `title` |

## Success response

`200`, also when nothing matches (`items` is then empty):

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
      "createdAt": "2026-01-11T00:00:00.000Z",
      "updatedAt": "2026-06-29T00:00:00.000Z"
    }
  ],
  "page": 1,
  "pageSize": 5,
  "totalItems": 1,
  "totalPages": 1
}
```

## Error response

`400` with code `INVALID_QUERY_PARAMETER` for any invalid `modality`, `status`, `page`, `pageSize` or `sort`:

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
curl "http://localhost:7071/api/courses?q=security&modality=online&status=active&pageSize=5"
```
