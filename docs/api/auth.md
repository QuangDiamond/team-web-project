# Auth API (`/api/auth/v1`)

Response chung: `{ "success": 1 | false, "message": "...", "data": ... }`.
Lỗi validate (422) có thêm `errors`: `{ "<field>": ["message", ...] }` để hiện lỗi dưới từng ô.
Token đăng nhập được set vào cookie httpOnly `token` (12h). Có thể gửi qua header `Authorization: Bearer <token>` khi test bằng Postman.

## POST `/register`
Đăng ký tài khoản (UC01.0). Tài khoản **chưa kích hoạt** (`email_verify_status = false`) cho đến khi user bấm link trong email.

Body:
```json
{
  "full_name": "Nguyen Van A",
  "email": "a@example.com",
  "password": "Abcdef12",
  "confirm_password": "Abcdef12",
  "role": "TUTOR",
  "agree_terms": true
}
```
- `password` (BR-01): 8–64 ký tự, ít nhất 1 chữ hoa, 1 chữ thường, 1 chữ số
- `role`: `TUTOR` | `PARENT` | `STUDENT`
- `agree_terms`: phải là `true`

| Status | Khi nào |
|---|---|
| 201 | Tạo thành công, `data` là user (không có token). Gửi email lỗi vẫn trả 201 |
| 409 | `This email is already registered` (E2) |
| 422 | Dữ liệu không hợp lệ (E1) |

## GET `/verify-email?token=<token>`
Link trong email kích hoạt (hết hạn sau 24h, dùng 1 lần). Không trả JSON mà redirect trình duyệt:
- Thành công → `{CORS_ORIGIN}/login?verify=success`
- Sai / hết hạn / đã dùng → `{CORS_ORIGIN}/login?verify=invalid` (E3: hiển thị "Link expired" + nút gửi lại)

## POST `/resend-verification`
Body: `{ "email": "a@example.com" }`

Luôn trả **200** với cùng message (không lộ email đã đăng ký hay chưa). Chỉ gửi thật khi email tồn tại, chưa kích hoạt và lần gửi trước đã quá 60 giây. Link cũ bị vô hiệu khi gửi link mới.

## POST `/login`
Body: `{ "email": "...", "password": "..." }`

| Status | Khi nào |
|---|---|
| 200 | Thành công, set cookie `token`, `data` là user |
| 401 | `Invalid username or password` (kể cả tài khoản Google chưa có mật khẩu) |
| 403 | `Account not verified`: chưa bấm link kích hoạt |

## POST `/logout`
Xóa cookie `token`. Luôn trả 200 (không cần đăng nhập, token hết hạn vẫn logout được).

## GET `/me`
Cần đăng nhập. Trả về user hiện tại.

## GET `/google`
Mở bằng trình duyệt (không gọi bằng axios). Set cookie `oauth_state` (10 phút, chống CSRF) rồi redirect sang Google.

## GET `/oauth/redirect`
Google redirect về đây (giá trị `OAUTH_URI` trong `.env` phải trỏ tới endpoint này). Kết quả đều là redirect:
- Đã có tài khoản (theo `google_id`, hoặc theo email → tự liên kết Google và kích hoạt) → set cookie `token`, redirect `{CORS_ORIGIN}/`
- Chưa có tài khoản → redirect `{CORS_ORIGIN}/register/complete?ticket=<ticket>` (ticket hạn 15 phút)
- Lỗi / sai state → redirect `{CORS_ORIGIN}/login?oauth=failed`

## POST `/google/complete`
Màn "đăng ký bước 2" sau khi đăng nhập Google lần đầu.

Body:
```json
{ "ticket": "<ticket từ URL>", "full_name": "Nguyen Van A", "role": "PARENT", "agree_terms": true }
```

| Status | Khi nào |
|---|---|
| 201 | Tạo tài khoản đã kích hoạt (`email_verify_status = true`, `is_onboarded = true`, `has_password = false`), set cookie `token` |
| 401 | `Ticket invalid or expired` |
| 409 | `This email is already registered` |
| 422 | Dữ liệu không hợp lệ |
