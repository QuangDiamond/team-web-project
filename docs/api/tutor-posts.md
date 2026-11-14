# Tutor Posts API (`/api/tutor-posts/v1`)

Bài đăng quảng cáo dịch vụ dạy học của **chính gia sư**. Chỉ role `TUTOR` có hồ sơ (chưa có → 409 `Complete your tutor profile first`). **Chỉ bài `PUBLISHED`** được dùng để gợi ý gia sư cho phụ huynh (UC09) và gợi ý request cho gia sư (UC11).

> Middleware `authorize` chưa có nên service tự kiểm tra role, hồ sơ và quyền sở hữu.

| Status | Khi nào |
|---|---|
| 200 / 201 | Thành công |
| 403 | Không phải TUTOR |
| 404 | Bài không tồn tại, của người khác, id sai, hoặc đã xóa |
| 409 | Chưa có hồ sơ gia sư; bài đang `PENDING_MODERATION` (không sửa / đổi trạng thái / xóa được) |
| 422 | Dữ liệu không hợp lệ |

`price` phải lớn hơn 1000 (VND) và không quá 100.000.000, nếu không trả 422.

Item trả về: `_id, title, subject_name, grade_level, teaching_mode, price` (number), `schedule, description, status, is_locked` (đang chờ kiểm duyệt), `created_at, updated_at`.

## GET `/mine`
Bài của gia sư (không gồm bài đã xóa), mới nhất trước. Query: `status`, `page`, `limit`. Trả `{ items, pagination: { page, limit, total, totalPages } }`.

## GET `/:id`
Chi tiết một bài của mình.

## POST `/`
```json
{
  "title": "Gia sư Toán lớp 9", "subject_name": "Toán", "grade_level": "Lớp 9",
  "teaching_mode": "ONLINE | OFFLINE | HYBRID", "price": 150000,
  "schedule": "Tối thứ 3, thứ 5", "description": "Dạy kèm...",
  "status": "DRAFT | PUBLISHED"
}
```
`status` tùy chọn, mặc định `DRAFT`. `HIDDEN`, `DELETED`, `PENDING_MODERATION` không được tạo trực tiếp. Body `strictObject`: gửi `profile_id`, `image_urls`... bị từ chối.

## PUT `/:id`
Sửa nội dung (cùng các trường như POST, **không có `status`**). Không đổi được trạng thái ở đây.

## PATCH `/:id/status`
Body `{ "status": "DRAFT | PUBLISHED | HIDDEN" }`. Các trạng thái còn lại không được gia sư tự đặt (422).

## DELETE `/:id`
**Xóa mềm**: `status = DELETED`, dữ liệu vẫn nằm trong DB; bài biến mất khỏi danh sách và các API khác trả 404. Không có xóa cứng.

## Chưa làm
Tải ảnh minh họa (`image_urls` luôn rỗng), kiểm duyệt của quản trị viên (`PENDING_MODERATION`).
