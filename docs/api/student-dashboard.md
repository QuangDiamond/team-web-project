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

## GET `/assignments`

Danh sách tất cả bài tập thuộc các lớp đang tham gia của học sinh.

Query parameters:
- `page`: default 1
- `limit`: default 10, max 100
- `status`: `ALL` (default) | `PENDING` | `SUBMITTED` | `GRADED` | `OVERDUE`
- `classId`: ObjectId lớp học (tùy chọn)
- `search`: từ khóa tìm kiếm theo tiêu đề bài tập (tùy chọn)

Response:
```json
{
  "success": 1,
  "message": "Get all assignments successfully!",
  "data": {
    "items": [
      {
        "_id": "...",
        "title": "...",
        "instructions": "...",
        "due_date": "...",
        "total_points": 10,
        "allow_late_submission": false,
        "allow_resubmission": true,
        "results_published_at": "...",
        "question_count": 5,
        "status": "PENDING",
        "can_submit": true,
        "submission": {
          "_id": "...",
          "status": "SUBMITTED",
          "timeliness": "ON_TIME",
          "provisional_score": 8,
          "final_score": null,
          "overall_feedback": null,
          "submitted_at": "...",
          "graded_at": null,
          "attempt_number": 1
        },
        "class": {
          "_id": "...",
          "name": "...",
          "subject": "...",
          "tutor_name": "..."
        }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 },
    "counts": { "ALL": 1, "PENDING": 0, "SUBMITTED": 1, "GRADED": 0, "OVERDUE": 0 }
  }
}
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

## GET `/activity`

Dữ liệu hoạt động học tập của học sinh theo các tuần gần nhất để vẽ biểu đồ đường (Line Chart).

Query parameters:
- `weeks`: số tuần thống kê (4 đến 12, mặc định 6).

Response:
```json
{
  "success": 1,
  "message": "Get learning activity successfully!",
  "data": {
    "summary": {
      "totalSubmissions": 10,
      "gradedSubmissionsCount": 8,
      "averageScore": 8.4,
      "totalSessions": 6,
      "totalActivities": 16
    },
    "points": [
      {
        "weekIndex": 1,
        "label": "29/09 - 05/10",
        "shortLabel": "T-5",
        "avgScore": 8.0,
        "submissionsCount": 2,
        "sessionsCount": 1,
        "activityCount": 3
      }
    ]
  }
}
```

## GET `/submissions/history`

Lịch sử tất cả các lần nộp bài tập của học sinh kèm điểm số, nhận xét và thống kê tổng hợp.

Query parameters:
- `page`: số trang (mặc định 1)
- `limit`: số bản ghi trên một trang (mặc định 10, tối đa 100)
- `classId`: ID lớp học để lọc (tùy chọn)
- `search`: từ khóa tìm kiếm theo tên bài tập (tùy chọn)
- `status`: `ALL` (mặc định) | `GRADED` | `SUBMITTED`

Response:
```json
{
  "success": 1,
  "message": "Get submission history successfully!",
  "data": {
    "items": [
      {
        "_id": "...",
        "assignment_id": "...",
        "attempt_number": 1,
        "timeliness": "ON_TIME",
        "status": "GRADED",
        "provisional_score": 8.0,
        "final_score": 9.0,
        "overall_feedback": "Bài làm tốt, trình bày rõ ràng",
        "submitted_at": "2026-11-13T10:00:00.000Z",
        "graded_at": "2026-11-13T11:00:00.000Z",
        "assignment": {
          "_id": "...",
          "title": "Bài tập trắc nghiệm chương 1",
          "total_points": 10,
          "due_date": "2026-11-15T23:59:59.000Z",
          "allow_late_submission": false
        },
        "class": {
          "_id": "...",
          "name": "Toán 12 Cơ bản",
          "subject": "Toán",
          "tutor_name": "Nguyễn Văn A"
        }
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 },
    "stats": {
      "totalSubmissions": 1,
      "gradedCount": 1,
      "averageScore": 9.0
    }
  }
}
```

## GET `/schedule`

Lấy lịch học (sessions) của tất cả các lớp mà học sinh đang tham gia theo khoảng thời gian (phục vụ hiển thị Calendar tuần / tháng).

Query parameters:
- `startDate`: Ngày bắt đầu khoảng thời gian (ISO datetime hoặc YYYY-MM-DD, tùy chọn)
- `endDate`: Ngày kết thúc khoảng thời gian (ISO datetime hoặc YYYY-MM-DD, tùy chọn)
- `classId`: ID lớp học cụ thể để lọc (tùy chọn)
- `status`: `ALL` (mặc định) | `SCHEDULED` | `COMPLETED` | `CANCELLED`

Response:
```json
{
  "success": 1,
  "message": "Get student schedule successfully!",
  "data": {
    "items": [
      {
        "_id": "...",
        "class_id": "...",
        "title": "Buổi 1: Giới thiệu giải tích",
        "start_time": "2026-11-16T08:00:00.000Z",
        "end_time": "2026-11-16T09:30:00.000Z",
        "meeting_link": "https://meet.google.com/xyz-abc",
        "status": "SCHEDULED",
        "class": {
          "_id": "...",
          "name": "Toán 12 Chuyên đề",
          "subject": "Toán",
          "tutor_name": "Trần Văn B"
        }
      }
    ],
    "stats": {
      "totalSessions": 1,
      "upcomingCount": 1,
      "completedCount": 0
    }
  }
}
```


