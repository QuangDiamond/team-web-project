# Student Dashboard API (`/api/student-dashboard/v1`) – UC36

Response chung: `{ "success": 1 | false, "message": "...", "data": ... }`.

Mọi endpoint cần đăng nhập (cookie `token` hoặc `Authorization: Bearer <token>`) và chỉ dành cho role `STUDENT`.

> Middleware `authorize` chưa có (AGENTS.md: Planned) nên service tự kiểm tra role. Route có `// TODO: authorize('STUDENT')`.

| Status | Khi nào |
|---|---|
| 200 | Thành công |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | `Only student accounts can view the student dashboard` |
| 422 | `page` / `limit` không hợp lệ (`errors` theo từng field) |

## Phân trang (mọi endpoint)

Query: `page` (mặc định 1), `limit` (mặc định 10, tối đa 100).

```json
{
  "success": 1,
  "message": "...",
  "data": {
    "items": [],
    "pagination": { "page": 1, "limit": 10, "total": 0, "totalPages": 0 }
  }
}
```

Object `class` gắn trong buổi học, bài tập, điểm: `{ "_id", "name", "subject", "tutor_name" }`.

## GET `/classes`

Lớp học sinh đang tham gia: `CLASS_MEMBERS.status = ACTIVE` và `CLASSROOMS.status = ACTIVE`. Lớp mới tạo nhất trước.

```json
{ "_id": "...", "name": "Toán 9 – Ôn thi vào 10", "subject": "Toán", "grade": "Lớp 9", "description": "...", "tutor_name": "Nguyễn Văn Minh", "joined_at": "2026-10-10T12:00:00.000Z" }
```

## GET `/sessions/upcoming`

Buổi học `SCHEDULED` có `start_time` trong khoảng **từ bây giờ đến 7 ngày tới**, thuộc các lớp đang tham gia. Sớm nhất trước.

```json
{ "_id": "...", "title": "Buổi 3", "start_time": "...", "end_time": "...", "meeting_link": "https://meet.google.com/...", "class": { ... } }
```

## GET `/assignments/pending`

Bài tập `PUBLISHED` (và `published_at` đã tới hoặc null) của các lớp đang tham gia mà học sinh **chưa có** bài nộp `SUBMITTED` / `GRADED`. Hạn nộp gần nhất trước.

```json
{ "_id": "...", "title": "...", "due_date": "...", "total_points": 10, "allow_late_submission": false, "status": "OVERDUE", "can_submit": false, "class": { ... } }
```

- `status`: `PENDING` (chưa làm) | `IN_PROGRESS` (có bài làm dở) | `OVERDUE` (quá `due_date`)
- `can_submit`: `false` khi quá hạn và `allow_late_submission` không phải `true`

## GET `/grades`

Điểm đã công bố: bài nộp `GRADED` của học sinh, thuộc bài tập có `results_published_at` đã tới. Mỗi bài tập chỉ lấy lần nộp đã chấm có `attempt_number` lớn nhất. Mới chấm nhất trước.

```json
{ "_id": "...", "assignment_id": "...", "assignment_title": "...", "total_points": 10, "final_score": 8.5, "overall_feedback": "Làm tốt...", "graded_at": "...", "class": { ... } }
```
