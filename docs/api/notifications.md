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

