# Class Session API (`/api/classroom/v1`)

The mutating endpoints (POST, PATCH, DELETE) require an authenticated `TUTOR` who owns the classroom. Read endpoints (GET) are available to the classroom owner (TUTOR), active student members (STUDENT), and their linked parents (PARENT).

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

Deletes a future session record. Sessions whose `start_time` is in the past or has already arrived cannot be deleted (`422`). Attendance is embedded in the session and is removed with it.

## POST `/:classId/sessions/:sessionId/attendance`

Marks student attendance for a session (SRS UC26.A2 / SDS markAttendance). Only the tutor who owns the active classroom can mark attendance. The session must have started (`start_time <= now`). Marking attendance updates the session's `attendance` subdocuments and marks session `status` as `COMPLETED`.

Request body:
```json
{
  "attendance": [
    {
      "student_user_id": "67355152a2ff8217bbba9101",
      "status": "PRESENT",
      "comment": "Tham gia tích cực"
    }
  ]
}
```
`status` must be one of `PRESENT`, `ABSENT`, `LATE`.

## POST `/:classId/sessions/:sessionId/change-requests`

Submits a request to reschedule or cancel a session (SRS UC27 / BR-10). Must be an active student member of the classroom.
- **Advance notice constraint:** Must be submitted at least 12 hours before `session.start_time`. Submissions within 12 hours are rejected with `400`.
- Request body for Move:
```json
{
  "request_type": "MOVE",
  "proposed_start_time": "2026-12-05T09:00:00+07:00",
  "proposed_end_time": "2026-12-05T10:30:00+07:00",
  "reason": "Em bận thi học kỳ sáng thứ 7"
}
```
- Request body for Cancel:
```json
{
  "request_type": "CANCEL",
  "reason": "Em bị ốm phải nằm viện"
}
```

## GET `/:classId/change-requests`

Lists all schedule change requests for the classroom. Accessible by the tutor (owner) and active members. Tutors see all requests; students see their own requests.

## PATCH `/:classId/change-requests/:requestId`

Approves or rejects a change request (SRS UC28). Tutor-only.
Request body:
```json
{
  "status": "APPROVED",
  "tutor_comment": "Thầy đồng ý dời sang 9h sáng thứ 7"
}
```
When `APPROVED`:
- If `request_type === 'MOVE'`: Automatically checks tutor conflict on the proposed time window and updates `session.start_time` and `session.end_time`.
- If `request_type === 'CANCEL'`: Marks `session.status = 'CANCELLED'`.
- Status transitions: `PENDING` -> `APPROVED` or `REJECTED`.

Status codes: `400` invalid input / less than 12h notice, `401` unauthenticated, `403` wrong role or classroom owner, `404` classroom/session/request not found, `409` tutor conflict or archived classroom, `422` invalid schema.
