# Admin – User Management API (`/api/admin/v1`) – UC37

Response chung: `{ "success": 1 | false, "message": "...", "data": ... }`. Lỗi validate (422) có thêm `errors`.
Mọi endpoint cần đăng nhập + role `ADMIN` (401 chưa đăng nhập, 403 `Forbidden` nếu không phải Admin).

## Khóa tài khoản có hiệu lực ngay (D18, D19)
- Middleware `authentication` đọc user từ DB ở **mọi request**: user không còn → 401; `account_status` khác `ACTIVE`
  → **403 `Your account has been suspended or banned`**; `req.user.role` lấy từ DB (đổi role / khóa có hiệu lực ngay,
  cookie cũ của user bị khóa không dùng được nữa).
- `POST /auth/v1/login`: sai mật khẩu vẫn trả 401 như cũ (không lộ trạng thái); **đúng mật khẩu** mà tài khoản bị khóa
  → 403 cùng message trên.
- Đăng nhập Google với tài khoản bị khóa → redirect `{CORS_ORIGIN}/login?oauth=locked`.
- `SUSPENDED` (khóa tạm) và `BANNED` (khóa do vi phạm) chặn giống nhau, mở lại bằng `ACTIVE`.

## GET `/users?page=1&limit=10&q=&role=&status=&from=&to=`
Danh sách user, mới nhất trước.
- `q`: tìm trong họ tên **hoặc** email, không phân biệt hoa thường, so khớp nguyên văn (ký tự đặc biệt được escape), tối đa 100 ký tự
- `role`: `PARENT` | `TUTOR` | `STUDENT` | `ADMIN`
- `status`: `ACTIVE` | `SUSPENDED` | `BANNED`
- `from` / `to`: ngày tạo tài khoản, dạng `YYYY-MM-DD` theo giờ Việt Nam, lấy trọn ngày (giống UC18)
- Sai giá trị → 422. `page` / `limit` sai thì dùng mặc định (limit tối đa 100)

```json
{
  "items": [
    { "_id": "...", "full_name": "Trần Văn A", "email": "a@example.com", "role": "TUTOR", "account_status": "ACTIVE",
      "email_verify_status": true, "created_at": "...", "last_login_at": "..." }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```

## GET `/users/:id`
```json
{
  "user": {
    "_id": "...", "full_name": "...", "email": "...", "role": "TUTOR", "account_status": "ACTIVE",
    "email_verify_status": true, "created_at": "...", "last_login_at": "...",
    "avatar_url": null, "has_password": true, "google_linked": false, "credit_balance": 7, "plan_name": "FREE_DEFAULT"
  },
  "audit_logs": [
    { "action": "UNLOCK_USER", "reason": "Appeal accepted", "admin": { "_id": "...", "full_name": "System Admin" }, "created_at": "..." }
  ]
}
```
- `credit_balance`: `null` nếu user không có ví (STUDENT, ADMIN)
- `plan_name`: gói còn hạn (`PRO`), không thì `FREE_DEFAULT` với TUTOR / PARENT, `null` với role khác
- `audit_logs`: 20 log gần nhất có `target_user_id` = user này (`LOCK_USER`, `UNLOCK_USER`, `UPDATE_SETTINGS`)
- 404 `User not found`: id sai định dạng hoặc không tồn tại

## PATCH `/users/:id/status`
Body: `{ "account_status": "SUSPENDED", "reason": "Spam reports" }`
- `account_status`: `ACTIVE` | `SUSPENDED` | `BANNED`; `reason`: trim, 1–500 ký tự

| Status | Khi nào |
|---|---|
| 200 | `data` là user (dạng danh sách) sau khi đổi |
| 403 | `You cannot change your own account status` (E1, D21; so theo id đã load nên id viết hoa cũng bị chặn). Khóa Admin khác thì được |
| 404 | Không tìm thấy user |
| 422 | Sai dữ liệu / `The account is already <STATUS>` (trùng trạng thái hiện tại) / `At least one active admin is required` (khóa Admin ACTIVE cuối cùng, D24) |

Sau khi đổi:
- Audit (BR-16): `SUSPENDED` / `BANNED` → `LOCK_USER`, `ACTIVE` → `UNLOCK_USER`;
  `details_json: { before: { account_status }, after: { account_status } }`, kèm `target_user_id`, `reason`, `ip_address`.
- Gửi email báo user (trạng thái mới + lý do). Gửi lỗi chỉ ghi log, API vẫn 200.

## POST `/users/admins`
Tạo Admin mới với mật khẩu tạm (A1, D20). Body: `{ "full_name": "...", "email": "...", "reason": "..." }`
(field khác như `role` bị bỏ qua, luôn tạo `ADMIN`).

201:
```json
{ "user": { "_id": "...", "full_name": "...", "email": "...", "role": "ADMIN", "account_status": "ACTIVE",
            "email_verify_status": true, "created_at": "...", "last_login_at": null },
  "temporary_password": "n5b8g7C8jPYq" }
```
- `temporary_password`: 12 ký tự ngẫu nhiên, đủ BR-01 (chữ hoa, chữ thường, chữ số). **Chỉ trả về 1 lần** (không lưu
  dạng đọc được), frontend hiển thị 1 lần cho Admin. Đồng thời gửi email cho Admin mới (lỗi gửi chỉ ghi log).
- Tài khoản mới: `email_verify_status: true`, `has_password: true`, đăng nhập được ngay bằng mật khẩu tạm.
- Audit: `UPDATE_SETTINGS`, `target_user_id` = Admin mới, `details_json: { operation: "CREATE_ADMIN", target_email }`.

| Status | Khi nào |
|---|---|
| 201 | Tạo thành công |
| 409 | `This email is already registered` (so khớp không phân biệt hoa thường; email Admin mới được lưu chữ thường) |
| 422 | Sai dữ liệu (email sai, thiếu reason, ...) |
