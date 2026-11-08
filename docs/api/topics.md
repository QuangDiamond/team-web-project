# Topic API (`/api/classroom/v1`)

## GET `/:classId/topics`

Returns a paginated list of topics embedded in the classroom. Requires authentication and role `TUTOR`. The tutor must own the classroom, and the classroom must be active.

Query parameters: `page` (default `1`) and `limit` (default `10`, maximum `100`).

Successful response (`200`):

```json
{
  "success": 1,
  "message": "Topics retrieved successfully!",
  "data": {
    "items": [{ "_id": "...", "name": "Chapter 1", "created_at": "..." }],
    "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
  }
}
```

Status codes: `401` unauthenticated, `403` wrong role or classroom owner, `404` classroom not found, `409` tutor profile missing or classroom archived, `422` invalid pagination query.

## POST `/:classId/topics`

Creates a topic embedded in the classroom's `topics` array. Requires authentication and role `TUTOR`. The tutor must own the classroom, and the classroom must be active.

Request body:

```json
{
  "name": "Chapter 1"
}
```

`name` is required, trimmed, and limited to 100 characters.

Successful response (`201`):

```json
{
  "success": 1,
  "message": "Topic created successfully!",
  "data": {
    "_id": "...",
    "name": "Chapter 1",
    "created_at": "..."
  }
}
```

Status codes: `401` missing or invalid authentication, `403` non-tutor or the classroom is owned by another tutor, `404` classroom not found, `409` tutor profile missing or classroom archived, `422` invalid request body.

## PATCH `/:classId/topics/:topicId`

Updates a topic's name. It uses the same authentication, tutor ownership, and active-classroom checks as topic creation.

Request body:

```json
{
  "name": "Chapter 1 - Linear Equations"
}
```

Successful response (`200`) returns the updated topic. Status codes: `200` success, `401` unauthenticated, `403` wrong role or classroom owner, `404` classroom/topic not found, `409` tutor profile missing or classroom archived, `422` invalid request body.

## DELETE `/:classId/topics/:topicId`

Deletes the topic from the embedded `Classroom.topics` array. Any `CLASS_MATERIALS` document that references it has `topic_id` set to `null`; the material itself is preserved. Both changes run in one MongoDB transaction.

Successful response (`200`):

```json
{
  "success": 1,
  "message": "Topic deleted successfully!",
  "data": {
    "_id": "...",
    "name": "Chapter 1",
    "detached_materials": 2
  }
}
```

Status codes: `200` success, `401` unauthenticated, `403` wrong role or classroom owner, `404` classroom/topic not found, `409` tutor profile missing or classroom archived.
