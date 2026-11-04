# Parent Requests API (`/api/parent-requests/v1`) – UC10 Manage Tutoring Requests

Response chung: `{ "success": 1 | false, "message": "...", "data": ... }`. Mọi endpoint cần đăng nhập và chỉ dành cho role `PARENT`; chỉ thao tác trên request **của chính mình** (request của người khác trả 404).

> Middleware `authorize` chưa có (AGENTS.md: Planned) nên service tự kiểm tra role. Route có `// TODO: authorize('PARENT')`.

| Status | Khi nào |
|---|---|
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Không phải tài khoản PARENT |
| 404 | Request không tồn tại, id sai định dạng, hoặc thuộc phụ huynh khác |
| 409 | Request không còn sửa được (khác `DRAFT`/`OPEN`) |
| 422 | Dữ liệu không hợp lệ (có `errors` theo field), kể cả gửi `parent_user_id`/`status`/... hoặc `student_id` không phải con đã liên kết |

## GET `/children`
Học sinh có `PARENT_CHILD_LINKS.status = ACCEPTED` với phụ huynh, để chọn trong form. Trả mảng `{ _id, full_name, email, avatar_url }`.

## GET `/`
Query: `status` (một trong enum `ParentRequestsStatus`), `page` (mặc định 1), `limit` (mặc định 10, tối đa 100). Mới nhất trước. Trả `{ items, pagination: { page, limit, total, totalPages } }`.

## GET `/:id`
Chi tiết một request.

## POST `/`
Tạo và đăng request, `status = OPEN`.

```json
{
  "title": "Tìm gia sư Toán lớp 9",
  "student_id": "<ObjectId con đã liên kết> | null",
  "subject_name": "Toán",
  "grade_level": "Lớp 9",
  "description": "Mục tiêu học tập",
  "schedule": "Tối thứ 3, thứ 5",
  "budget": 250000,
  "teaching_mode": "ONLINE | OFFLINE | HYBRID",
  "location_address": "Bắt buộc khi OFFLINE / HYBRID",
  "tutor_requirements": "tùy chọn"
}
```
Body dùng `strictObject`: gửi thêm field lạ bị từ chối. `parent_user_id` luôn lấy từ JWT, `status` do server quyết định.

## PUT `/:id`
Sửa nội dung (cùng body như POST) khi request đang `DRAFT` hoặc `OPEN`.

## Item trả về
`_id, title, subject_name, grade_level, teaching_mode, budget` (number), `schedule, description, location_address, tutor_requirements, status, student_id, student` (`{_id, full_name, email, avatar_url}` hoặc null), `application_count` (không tính đơn đã rút), `is_expired` (OPEN quá 30 ngày, BR-05), `can_edit, created_at, updated_at`.

## Liên quan
- `GET /:id/applications`: danh sách đơn ứng tuyển của request (xem [applications.md](applications.md)).

## Chưa làm
- Đóng / hủy request (`CLOSED` vs `CANCELLED`): tài liệu nghiệp vụ chưa định nghĩa quy tắc chuyển trạng thái.
- Xóa cứng; đổi `status` sang `EXPIRED` (hiện chỉ kiểm tra "hết hạn" khi đọc, chưa có job).
