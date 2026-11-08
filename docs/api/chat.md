# Chat API (`/api/chat/v1`)

Chat 1-1 giữa **phụ huynh và gia sư**. Hội thoại được mở khi phụ huynh Continue một đơn ứng tuyển hoặc gia sư Accept một lời mời (xem `applications.md`, `invitations.md`). Chỉ role `PARENT` và `TUTOR` (role khác → 403). Cần đăng nhập.

> Chưa realtime: giao diện tải lại định kỳ (polling) 4 giây cho khung tin nhắn và 8 giây cho danh sách. Không dùng WebSocket (cần thêm thư viện). Chưa có tin nhắn ảnh / file.

| Status | Khi nào |
|---|---|
| 200 / 201 | Thành công |
| 403 | Không phải PARENT hoặc TUTOR |
| 404 | Hội thoại không tồn tại, id sai, **không phải một trong hai bên** (người ngoài cuộc nhận 404, không lộ sự tồn tại), hoặc là chat nhóm lớp |
| 409 | Gửi tin vào hội thoại đã đóng (`is_active = false`) |
| 422 | `page` / `limit` sai, hoặc nội dung tin không hợp lệ |

Phân trang như mọi API danh sách: `page` (mặc định 1), `limit` (mặc định 10, tối đa 100).

## GET `/conversations`
Hội thoại 1-1 **đang mở** của người dùng, có hoạt động gần nhất trước. Gia sư chưa có hồ sơ nhận danh sách rỗng (không phải lỗi).

```json
{
  "items": [
    {
      "_id": "...",
      "request": { "_id": "...", "title": "Tìm gia sư Toán lớp 9" },
      "other": { "name": "Nguyễn Văn Minh", "role": "TUTOR", "headline": "Gia sư Toán", "avatar_url": null },
      "last_message": { "content": "Dạ được chị", "message_type": "TEXT", "sender_is_me": false, "created_at": "..." },
      "unread_count": 2,
      "updated_at": "..."
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```
`other` là người đối diện: phụ huynh thấy gia sư (tên, headline), gia sư thấy phụ huynh (**chỉ tên**, không có email / SĐT).

## GET `/conversations/:id`
Tóm tắt một hội thoại (cùng dạng một item ở trên, thêm `is_active`), dùng cho phần đầu khung chat.

## GET `/conversations/:id/messages`
Tin nhắn, **mới nhất trước** (`page = 1` là các tin mới nhất; trang sau là tin cũ hơn). Item: `_id, content, message_type, sender_is_me, created_at`. Không trả id người gửi.

## POST `/conversations/:id/messages`
Body `{ "content": "..." }`: bắt buộc, tự cắt khoảng trắng hai đầu, tối đa 2000 ký tự. Body `strictObject`: gửi `sender_user_id`, `message_type`, `attachments`... bị từ chối. Người gửi lấy từ JWT, loại tin luôn là `TEXT`. Trả `201` với tin vừa gửi.

Gửi tin đưa hội thoại lên đầu danh sách của cả hai bên và tính là **đã đọc** với người gửi.

## POST `/conversations/:id/read`
Không có body. Đánh dấu đã đọc đến tin mới nhất. Mỗi người dùng chỉ có đúng một mục trong `read_states` của hội thoại (kể cả khi gọi đồng thời). Trả `{ "unread_count": 0 }`.

`unread_count` = số tin của **người kia** gửi sau lần đọc gần nhất của mình.

## Liên quan
- `GET /api/applications/v1/mine` (gia sư) và `GET /api/invitations/v1/mine` (phụ huynh) trả thêm `conversation_id` cho đơn `CONTINUED` / lời mời `ACCEPTED` có hội thoại đang mở, để hiện nút "Open chat". Hội thoại đã đóng không có `conversation_id`.
