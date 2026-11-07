# Course catalog

`GET /api/courses` searches the fixture catalog. All fields are optional: `q` searches title, summary and tags without case sensitivity; `modality` accepts `online`, `in-person`, `hybrid`; `status` accepts `draft`, `active`, `retired`; `tag` matches a tag without case sensitivity. `page` defaults to 1; `pageSize` defaults to 10 and may be 1–50; `sort` is `title` (default), `createdAt`, or `updatedAt`, ascending.

A successful request returns `200` with `{ "items": [Course], "page": 1, "pageSize": 10, "totalItems": 12, "totalPages": 2 }`. A Course has `id`, `title`, `summary`, `modality`, `status`, `tags`, `createdAt`, and `updatedAt`. Empty searches return an empty `items` array with the same pagination fields.

Invalid or repeated query parameters return `400` with `{ "error": { "code": "INVALID_QUERY_PARAMETER", "message": "One or more query parameters are invalid.", "details": [{ "field": "pageSize", "message": "pageSize must be between 1 and 50." }] } }`.
