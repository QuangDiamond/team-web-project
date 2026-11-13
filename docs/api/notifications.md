# Notifications API (`/api/notifications/v1`) – UC33 View Notifications

Dành cho mọi người dùng đã đăng nhập (`PARENT`, `TUTOR`, `STUDENT`, `ADMIN`).

## GET `/`
Query: `category` (tùy chọn), `is_read` (`true` | `false`, tùy chọn).
Trả về `{ unreadCount, notifications }` của người dùng hiện tại (`recipient_user_id = req.user.id`), kèm `deepLink` điều hướng về trang tương ứng trong Dashboard.

## GET `/unread-count`
Trả về `{ unreadCount }` phục vụ hiển thị badge trên chuông thông báo ở `DashboardHeader` và `Layout`.

## GET `/preferences`
Trả về `{ preferences: { in_app, email, sms } }` từ `User.notification_preferences` của người dùng hiện tại.

## PUT `/preferences`
Body: `{ "in_app": true, "email": true, "sms": false }`.
Cập nhật cấu hình kênh nhận thông báo (`User.notification_preferences`) theo UC33 A3.

## PATCH `/:notificationId/read`
Đánh dấu một thông báo của người dùng là đã đọc (`is_read = true`, `read_at = now`).

## POST `/mark-all-read`
Đánh dấu toàn bộ thông báo chưa đọc của người dùng là đã đọc.

## DELETE `/:notificationId`
Xóa một thông báo của người dùng.


## Thông báo do hệ thống tự tạo (không đổi API contract)

| Sự kiện | Người nhận | category / target_type | Cấu hình được tôn trọng |
|---|---|---|---|
| Gửi tin nhắn 1-1 (`POST /chat/v1/conversations/:id/messages`) | Bên còn lại của hội thoại | `CONVERSATION` / `CONVERSATION` (target_id = conversation) | `enable_in_app`, `notify_on_messages` |
| Gia sư tạo / sửa / hủy (status `CANCELLED`) / xóa buổi học (`/classroom/v1/:classId/sessions`) | Phụ huynh (liên kết `ACCEPTED`) của học sinh `ACTIVE` trong lớp | `SESSION` / `CLASSROOM` | `enable_in_app`, `notify_on_sessions` |
| Gia sư giao bài tập `PUBLISHED` | Phụ huynh của học sinh trong lớp (trừ phụ huynh đã là thành viên lớp, vì đã nhận thông báo thành viên) | `ASSIGNMENT` / `ASSIGNMENT` | `enable_in_app`, `notify_on_assignments` |
| Gia sư đăng thông báo lớp | Như trên | `SYSTEM` / `CLASSROOM` | `enable_in_app` |
| Gia sư chấm điểm (đã có từ trước) | Học sinh và phụ huynh liên kết | `ASSIGNMENT` / `ASSIGNMENT` | — |

- Thông báo tin nhắn có tiêu đề bắt đầu bằng `Tin nhắn mới từ ` (hằng `DIRECT_MESSAGE_TITLE_PREFIX`). Mỗi hội thoại chỉ giữ **một** thông báo tin nhắn chưa đọc cho mỗi người nhận (tin mới thay tin cũ) để chuông không bị spam. `deepLink` = `/<role>/messages/<conversationId>`.
- Khi người nhận mở hội thoại (`POST /chat/v1/conversations/:id/read`), các thông báo tin nhắn của hội thoại đó được đánh dấu đã đọc.
- Lỗi khi tạo thông báo chỉ được ghi log; thao tác chính (gửi tin, tạo buổi học, ...) vẫn thành công.

## Chuông thông báo (frontend)

`components/common/NotificationBell.jsx`, dùng ở `DashboardHeader` và navbar `Layout`:
- Badge hiện `unreadCount` (cập nhật mỗi 5 giây, tối đa hiển thị `99+`), ẩn khi bằng 0.
- Bấm chuông: tải thông báo gần nhất (6 cái), rồi gọi `POST /mark-all-read` → badge về 0. Các thông báo vừa chưa đọc vẫn được tô nổi trong lần mở đó.
- Bấm một thông báo → điều hướng theo `deepLink`; "Xem tất cả thông báo" → trang Thông báo.
