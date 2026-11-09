# Class Session API (`/api/classroom/v1`)

All endpoints require an authenticated `TUTOR`. The tutor must own the classroom, and the classroom must be active.

## GET `/:classId/sessions`

Returns the classroom's sessions ordered by `start_time` ascending. Query parameters: `page` (default `1`) and `limit` (default `10`, maximum `100`). Response data contains `items` and `pagination`.

## GET `/:classId/sessions/:sessionId`

Returns one session belonging to the specified classroom.

## POST `/:classId/sessions`

Creates a one-off session. Request body:

```json
{
  "title": "Math lesson",
  "start_time": "2026-12-01T09:00:00+07:00",
  "end_time": "2026-12-01T10:00:00+07:00",
  "meeting_link": "https://meet.google.com/example",
  "status": "SCHEDULED"
}
```

`title`, `start_time`, and `end_time` are required. Times must be ISO datetime strings with a timezone, and `end_time` must be later than `start_time`. `meeting_link` is optional and can be `null`. `status` is optional and defaults to `SCHEDULED`; allowed values in the current backend/database enum are `SCHEDULED`, `CANCELLED`, and `COMPLETED`. The backend sets `class_id` from the URL, `tutor_profile_id` from the owned classroom, and `rule_id` to `null` for a one-off session.

`start_time` must be in the future. A past or current start time is rejected with `422`.

## PATCH `/:classId/sessions/:sessionId`

Updates one or more of `title`, `start_time`, `end_time`, `meeting_link`, and `status`. At least one field is required. When changing the schedule, send both `start_time` and `end_time`; the end must be later than the start.

Sessions whose `start_time` is in the past or has already arrived cannot be updated, even when changing non-schedule fields. For future sessions, a new `start_time` must also be in the future when changing the schedule.

## DELETE `/:classId/sessions/:sessionId`

Deletes a future session record. Sessions whose `start_time` is in the past or has already arrived cannot be deleted (`422`). Attendance is embedded in the session and is removed with it. These CRUD endpoints do not create or modify recurring rules.

Status codes: `401` unauthenticated, `403` wrong role or classroom owner, `404` classroom/session not found, `409` tutor profile missing or classroom archived, `422` invalid DTO or pagination.
