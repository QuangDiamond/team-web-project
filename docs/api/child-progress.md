# Child Progress API (`/api/child-progress/v1`) – UC35 Monitor Child Progress

Phụ huynh (role `PARENT`) theo dõi lớp học, buổi học sắp tới, điểm danh, kết quả bài tập và xu hướng điểm của **từng người con đã liên kết**. Không thêm collection hay schema mới: dữ liệu lấy từ `CLASS_MEMBERS`, `CLASSROOMS`, `CLASS_SESSIONS` (mảng `attendance`), `ASSIGNMENTS`, `ASSIGNMENT_SUBMISSIONS`.

Liên kết phụ huynh – học sinh tạo bằng lời mời xác nhận, xem [parent-links.md](parent-links.md); sau khi học sinh chấp nhận, phụ huynh thấy mọi lớp học sinh tham gia mà không cần vào lớp.

Danh sách con để chọn lấy từ `GET /api/parent-requests/v1/children` (chỉ gồm liên kết `ACCEPTED`).

| Status | Khi nào |
|---|---|
| 200 | Thành công |
| 401 | Chưa đăng nhập |
| 403 | Không phải role `PARENT` |
| 404 | `childId` sai định dạng, con không liên kết với phụ huynh này (kể cả liên kết `PENDING`/`DECLINED`), hoặc kết quả không tồn tại / chưa công bố. Cố ý dùng chung 404 để không lộ học sinh khác |
| 422 | `page` / `limit` không hợp lệ |

Mọi API danh sách nhận `page` (mặc định 1) và `limit` (mặc định 10, tối đa 100) và trả `{ items, pagination: { page, limit, total, totalPages } }`.

## GET `/:childId/summary`
Tổng quan một người con.
```json
{
  "child": { "_id": "...", "full_name": "Phạm Minh An", "avatar_url": null },
  "class_count": 1,
  "attendance": { "present": 2, "late": 1, "absent": 1, "total": 4, "attended": 3, "rate": 75 },
  "results": { "count": 2, "average_percent": 75, "latest_percent": 90 }
}
```
- `attendance.rate` = (có mặt + đi muộn) / tổng lượt điểm danh × 100, 1 chữ số thập phân; `null` khi chưa có lượt nào. Buổi học `CANCELLED` không tính.
- `results` chỉ tính bài **đã công bố kết quả**; `average_percent` là trung bình `score_percent`; `latest_percent` là bài chấm gần nhất.

## GET `/:childId/classes`
Lớp con đang tham gia (thành viên `ACTIVE`, lớp `ACTIVE`). Cùng dạng với `GET /api/student-dashboard/v1/classes`: `{ _id, name, subject, grade, description, tutor_name, joined_at }`.

## GET `/:childId/sessions/upcoming`
Buổi học `SCHEDULED` trong 7 ngày tới, sớm nhất trước. Cùng dạng với `GET /api/student-dashboard/v1/sessions/upcoming`.

## GET `/:childId/attendance`
Lịch sử điểm danh, buổi gần nhất trước, mỗi buổi một dòng. Chỉ trả dòng điểm danh của **con này**, không lộ học sinh khác trong cùng buổi.
```json
{
  "items": [{ "session_id": "...", "title": "Buổi 3", "start_time": "...", "status": "ABSENT", "comment": "Ốm", "class": { "_id": "...", "name": "...", "subject": "Toán", "tutor_name": "..." } }],
  "pagination": { "page": 1, "limit": 10, "total": 4, "totalPages": 1 },
  "summary": { "present": 2, "late": 1, "absent": 1, "total": 4, "attended": 3, "rate": 75 }
}
```
`status`: `PRESENT | LATE | ABSENT`.

## GET `/:childId/results`
Kết quả các bài tập **đã được gia sư công bố** (`results_published_at` đã qua) và đã chấm (`GRADED`). Mỗi bài tập chỉ lấy lần nộp mới nhất; mới chấm trước.
```json
{
  "_id": "<submissionId>", "assignment_id": "...", "assignment_title": "Bài 1", "total_points": 10,
  "final_score": 6, "score_percent": 60,
  "auto_graded_points": 2, "manual_points": 4, "has_auto_graded": true,
  "overall_feedback": "Làm khá", "timeliness": "ON_TIME", "graded_at": "...",
  "class": { "_id": "...", "name": "...", "subject": "Toán", "tutor_name": "..." }
}
```
- `auto_graded_points`: điểm máy tự chấm (câu trắc nghiệm); `manual_points`: điểm gia sư chấm tay.
- Không trả bài làm chi tiết ở danh sách (xem `GET /results/:submissionId`).

## GET `/:childId/results/trend`
Xu hướng điểm: `limit` bài đã công bố **gần nhất**, trả theo thứ tự **cũ → mới** để vẽ biểu đồ. Item: `{ assignment_id, assignment_title, final_score, total_points, score_percent, graded_at }`. Giao diện dùng `limit=10`.

## GET `/:childId/results/:submissionId`
Chi tiết một kết quả (mở từ danh sách). Gồm các trường của danh sách cộng thêm `instructions` và `questions[]` theo thứ tự câu:
```json
{
  "question_id": "...", "question_number": 1, "question_type": "MULTIPLE_CHOICE", "content": "...", "options": ["A", "B", "C"],
  "correct_answer": "B", "points": 2,
  "answer": { "text_response": "B", "file_url": null, "score": 2, "is_auto_graded": true, "is_overridden": false, "comment": null }
}
```
- `correct_answer` chỉ có với câu trắc nghiệm; câu tự luận / nộp file luôn `null` (không lộ đáp án mẫu của gia sư).
- `answer` là `null` nếu con không trả lời câu đó; `is_overridden = true` khi gia sư sửa điểm máy chấm.
- Bài chưa công bố kết quả, bài của học sinh khác hoặc `submissionId` sai → 404.

## Quy tắc đã chọn (cần xác nhận nếu nghiệp vụ khác)
- "Đi muộn" được tính là đã tham dự khi tính tỉ lệ chuyên cần.
- Điểm phần trăm = `final_score / total_points × 100`, giới hạn 0–100; thiếu điểm hoặc tổng điểm thì `null`.
- Chỉ hiện kết quả sau khi gia sư công bố, giống Student Dashboard (UC36).
- Quyền chỉ theo liên kết `ACCEPTED` giữa phụ huynh và học sinh.
