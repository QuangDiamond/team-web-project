# Session API (`/api/session/v1`)

## GET `/`

Requires an authenticated `TUTOR`, `STUDENT`, or `PARENT`. Authentication verifies the token and current user record. Returns sessions visible to that user: tutor-owned classrooms, active classroom memberships for students, and active classroom memberships of children with accepted parent links. Sessions are ordered by `start_time` ascending. Query parameters: `page` (default `1`) and `limit` (default `10`, maximum `100`). Each item contains the session fields, `class_id`, and a `classroom` object (`_id`, `name`, `subject`, `grade`) for calendar display and navigation. Response data contains `items` and `pagination`.
