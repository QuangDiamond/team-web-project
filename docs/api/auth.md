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

`data.has_password` is always a boolean derived from the actual password hash, even when the
stored `has_password` flag is stale. The hash is never returned.

## POST `/forgot-password` (UC03, public)

Body: `{ "email": "a@example.com" }`. Invalid email input returns 422 with `errors.email`.

Every valid request returns the same 200 response immediately, before account lookup or SMTP:

```json
{ "success": 1, "message": "If the email exists, a reset link has been sent", "data": null }
```

Missing, unverified, suspended/banned accounts, requests within the 60-second resend cooldown,
and email delivery failures all produce that same response. Active, verified Google-only accounts
can also recover/set a password. The link opens `{CORS_ORIGIN}/reset-password?token=<raw-token>`;
its origin comes from trusted configuration, never the request Host header.

Delivery is scheduled in-process after returning the HTTP response, including the database lookup,
so SMTP and account existence do not determine response latency. This is **not a durable queue**:
restart/crash can lose pending work. Request another link after 60 seconds if no email arrives.

## POST `/reset-password` (UC03, public)

```json
{ "token": "<64 hexadecimal characters from email>", "new_password": "NewPassword2", "confirm_password": "NewPassword2" }
```

New passwords must contain 8–64 characters, an uppercase letter, a lowercase letter and a digit
(BR-01). The confirmation must match. Success is 200, `data: null`, message
`Password reset successfully. Please log in`; the `token` cookie is cleared. There is no auto-login.
All previously issued sessions fail authentication after the password changes.

| Status | Meaning |
|---|---|
| 400 | New password equals the old one; `errors.new_password` supports inline feedback. Link remains usable |
| 410 | Link invalid, expired, already consumed, or account unavailable |
| 409 | Credential/account changed concurrently; request another link |
| 422 | Invalid body, weak/mismatched password, or malformed token (`errors.token`) |

## POST `/change-password` (UC04, authenticated)

```json
{ "current_password": "OldPassword1", "new_password": "NewPassword2", "confirm_password": "NewPassword2" }
```

Existing-password accounts must provide the correct `current_password`. Authenticated Google-only
accounts may omit it to set their first password. The new password must meet BR-01, match confirmation,
and differ from the old password. Authentication runs before body validation.

Success: 200, message `Password changed successfully`. **`data` is the refreshed safe user directly**
(not `{ "user": ... }`), including derived `has_password: true`, with no password hash or JWT in the body.
The controller replaces the httpOnly session cookie; other sessions receive 401. Incorrect/missing
current passwords return 400 with `errors.current_password`; reused passwords return 400 with
`errors.new_password`. Invalid bodies return 422, unavailable accounts 403, concurrent writes 409.

### Reset token storage, concurrency and cleanup

- No model/schema change. The existing `PASSWORD_RESET_TOKENS` collection stores
  `SHA256(rawToken):passwordVersion(password_hash)` in `token_value`, never the raw token or
  password hash. The public token is 32 random bytes encoded as 64 hex characters.
  Expiry is exactly 15 minutes and checked in queries, independent of TTL cleanup.
  Reset finds the digest prefix, checks the current credential version, then consumes the exact
  stored value. Old links are invalid after a password change even when record cleanup fails.
  Legacy digests without a credential binding return 410.
- New recovery records use `_id = user._id`, leveraging the built-in unique index. A conditional
  upsert permits rotation only after 60 seconds (or when used); duplicate-key 11000 is a neutral
  cooldown/concurrent-request no-op. Rotation replaces the previous digest atomically.
- SMTP failure deletes only the matching newly issued digest, preserving any newer rotation.
  Recovery links use the first configured `CORS_ORIGIN` entry (the frontend address), never the full comma-separated list.
  Link-building or SMTP errors log only the error code/name as `Password recovery email failed`, without tokens, credentials or recipient addresses.
  Expired records are eventually removed by the existing TTL index. TTL index provisioning remains
  the existing database setup's responsibility (`autoIndex` is disabled).
- Reset reads a valid token and active, verified user, hashes the new password, then atomically
  consumes the matching unused/unexpired token. Credential replacement compares the original hash
  and active status. Change uses the same credential compare-and-set, preventing lost updates.
- Both successful credential writes reset `failed_login_attempts` and `is_login_locked`, without
  changing suspension/ban status. All reset records for that user are then deleted, including any
  legacy records with a random `_id`. A best-effort notification never includes passwords.
- No transactions/replica set are required. If the write fails after consumption, that link stays
  invalid: request a new link, then retry. A consumed record allows immediate resend.
- If deleting reset records fails **after** the credential write, the request fails (normally 500),
  the new password is already saved, and old sessions are already invalid. Change issues no new
  cookie; reset has not yet cleared the old cookie. Sign in with the submitted **new** password,
  then retry a password change after database recovery to clear remaining links. Do not replay
  the consumed reset link. If sign-in is impossible, request a new recovery link. Leftover links
  cannot overwrite the new credential because their stored password version no longer matches.

### Session migration and revocation

Session JWTs contain `password_version = SHA256(current password_hash or empty string)`, never
the password hash itself. Authentication reads the current credential and compares the fingerprint.
Login and Google callback explicitly retain the original hash across `updateUserLogin()`'s
`-password_hash` projection; Google registration uses its null password hash.

**Deployment forces a one-time re-login for all legacy JWTs without `password_version` (401).**
No persistent session version, timestamp, or `updated_at` heuristic is used. Reset revokes all old
sessions; change/set revokes old sessions and issues one replacement cookie for the current browser.

Security guidance: [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).

## GET `/google`
Mở bằng trình duyệt (không gọi bằng axios). Set cookie `oauth_state` (10 phút, chống CSRF) rồi redirect sang Google.

## GET `/oauth/redirect`
Google redirect về đây (giá trị `OAUTH_URI` trong `.env` phải trỏ tới endpoint này). Kết quả đều là redirect:
- Đã có tài khoản (theo `google_id`, hoặc theo email → tự liên kết Google và kích hoạt) → set cookie `token`, redirect `{CORS_ORIGIN}/dashboard`
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
