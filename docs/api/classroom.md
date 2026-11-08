# Classroom API (`/api/classroom/v1`)

## GET `/me`

Returns active classrooms associated with the authenticated user through `CLASS_MEMBERS`. Only `CLASS_MEMBERS` and `CLASSROOMS` records with `ACTIVE` status are included. The current user's ID comes from the authentication token; this endpoint does not accept an arbitrary user ID.

Authentication is required with cookie `token` or `Authorization: Bearer <token>`.

Query parameters:

- `page`: page number, defaults to `1`
- `limit`: number of items per page, defaults to `10`, maximum `100`

Successful response:

```json
{
  "success": 1,
  "message": "Get classrooms successfully!",
  "data": {
    "items": [
      {
        "_id": "...",
        "name": "Algebra",
        "subject": "Math",
        "grade": "Grade 9",
        "description": "...",
        "capacity": 20,
        "status": "ACTIVE",
        "created_at": "...",
        "joined_at": "..."
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "totalPages": 1
    }
  }
}
```

Status codes: `200` success, `401` missing or invalid authentication, `422` invalid pagination query.
