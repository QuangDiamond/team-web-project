# Schedule change requests

All endpoints require a JWT and are available to `TUTOR` and `STUDENT` users.

## List requests

`GET /api/schedule-change-requests/v1?page=1&limit=10`

Returns requests for sessions in the caller's classrooms, including request direction, status, session details, and whether the caller can respond. The response uses the standard paginated list envelope.

## Create a move request

`POST /api/schedule-change-requests/v1`

```json
{
  "session_id": "65f000000000000000000001",
  "proposed_start_time": "2026-11-20T09:00:00.000Z",
  "proposed_end_time": "2026-11-20T10:00:00.000Z",
  "reason": "I have an exam at the original time."
}
```

The session must not be cancelled or started, the request must be submitted at least 12 hours before its start, and the class must have exactly one active student. Only one pending request is allowed per session. For classes with multiple active students, students cannot submit requests; the tutor changes the schedule directly and active students receive notifications.

## Respond to a request

`PATCH /api/schedule-change-requests/v1/:requestId/respond`

```json
{
  "decision": "APPROVE",
  "response_comment": ""
}
```

`decision` is `APPROVE` or `REJECT`. A rejection requires a reason in `response_comment`. Only the other party can respond. Approval updates the session after rechecking that it has not started, the proposed time is still in the future, and the tutor has no overlapping session in another active class.
