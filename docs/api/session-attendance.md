# Session attendance

All routes require an authenticated `TUTOR`. The tutor must own the active classroom identified by `classId`, and the session must belong to that classroom.

## Get a session roster and attendance

`GET /api/classroom/v1/:classId/sessions/:sessionId/attendance?page=1&limit=100`

Returns active students in the class with their current mark, if one exists. The list uses standard pagination.

## Record attendance

`POST /api/classroom/v1/:classId/sessions/:sessionId/attendance`

May be called once the session has started and until 24 hours after its scheduled end. Submit one record for every active student:

```json
{
  "records": [
    {
      "student_user_id": "64b000000000000000000001",
      "status": "PRESENT",
      "comment": "Participated actively"
    }
  ]
}
```

`status` is `PRESENT`, `ABSENT`, or `LATE`. `comment` is optional and limited to 500 characters. Cancelled sessions cannot be marked.

## Update attendance

`PUT /api/classroom/v1/:classId/sessions/:sessionId/attendance`

Uses the same request body as `POST`. Attendance can be updated until 24 hours after the scheduled session end. It must already have been recorded once.
