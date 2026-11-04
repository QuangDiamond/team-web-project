# Dashboard Summary API (`/api/dashboard/v1`) – Parent / Tutor Dashboard

Số liệu tổng hợp cho hai trang Overview. Danh sách chi tiết trên dashboard dùng lại các API có phân trang sẵn có (`/parent-requests/v1`, `/tutor-requests/v1/suggestions`, `/invitations/v1/received`, `/applications/v1/mine`), nên các endpoint dưới đây chỉ trả về số đếm.

Cần đăng nhập. Middleware `authorize` chưa có (AGENTS.md: Planned) nên service tự kiểm tra role; route có `// TODO: authorize(...)`.

| Status | Khi nào |
|---|---|
| 200 | Thành công |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | Sai role (`/parent/summary` chỉ cho PARENT, `/tutor/summary` chỉ cho TUTOR) |

## GET `/parent/summary`
```json
{
  "open_requests": 2,
  "pending_applications": 5,
  "pending_invitations": 1,
  "active_conversations": 1,
  "credit_balance": 4
}
```
- `open_requests`: request của phụ huynh đang `OPEN` và chưa quá 30 ngày (BR-05).
- `pending_applications`: đơn `PENDING` (không tính đơn đã rút) trên các request trên, đang chờ phụ huynh Continue / Skip.
- `pending_invitations`: lời mời phụ huynh đã gửi và gia sư chưa trả lời (`PENDING`).
- `active_conversations`: hội thoại 1-1 đang mở.
- `credit_balance`: số dư credit (ví chưa có coi như 0).

## GET `/tutor/summary`
```json
{
  "has_profile": true,
  "available_requests": 3,
  "pending_applications": 2,
  "accepted_applications": 1,
  "pending_invitations": 1,
  "saved_requests": 1,
  "published_posts": 1,
  "active_conversations": 1,
  "credit_balance": 7
}
```
- `available_requests`: số request gia sư có thể duyệt (cùng điều kiện với `GET /tutor-requests/v1`).
- `pending_applications` / `accepted_applications`: đơn của gia sư đang `PENDING` / đã được phụ huynh `CONTINUED`.
- `pending_invitations`: lời mời nhận được chưa phản hồi.
- `published_posts`: bài đăng `PUBLISHED` của gia sư.
- **Gia sư chưa có hồ sơ**: trả `200` với `has_profile: false` và các số đếm bằng 0 (chỉ `credit_balance` thật), để giao diện nhắc hoàn thiện hồ sơ thay vì báo lỗi. Các API danh sách vẫn trả 409 trong trường hợp này.

Response không chứa thông tin cá nhân của người khác.

## Trang giao diện
| Role | URL | Menu |
|---|---|---|
| PARENT | `/parent/dashboard` (trang đích sau đăng nhập) | `PARENT_MENU` → Overview |
| TUTOR | `/tutor/dashboard` (trang đích sau đăng nhập) | `TUTOR_MENU` → Overview |

Cả hai dùng `DashboardLayout` chung (xem `docs/architecture/dashboard-frame.md`).
