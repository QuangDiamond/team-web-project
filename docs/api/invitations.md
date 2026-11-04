# Invitations API (`/api/invitations/v1`) – UC14 Invite Tutor

Phần gửi / xem / hủy dành cho role `PARENT`; phần `received` / `accept` / `decline` ở cuối tài liệu dành cho role `TUTOR`. Có `// TODO: authorize('PARENT')` ở route.

| Status | Khi nào |
|---|---|
| 201 / 200 | Thành công |
| 402 | `Not enough credits` (credit của **phụ huynh**) |
| 404 | Request không thuộc phụ huynh; gia sư không tồn tại hoặc tài khoản không `ACTIVE`; lời mời không thuộc phụ huynh |
| 409 | Request không còn OPEN / hết hạn; đã mời gia sư này vào request này; lời mời không còn `PENDING` |
| 422 | Body không hợp lệ (id sai, `message` > 500 ký tự, field lạ như `parent_user_id`/`status`) |

## POST `/`
Body: `{ "request_id": "<ObjectId>", "tutor_profile_id": "<ObjectId>", "message": "tùy chọn, ≤ 500 ký tự" }`.

Quy tắc:
1. `request_id` phải là request **của chính phụ huynh**, đang `OPEN` và chưa quá 30 ngày.
2. Mỗi gia sư chỉ được mời **một lần** cho mỗi request (unique `{request_id, tutor_profile_id}`).
3. Cần ≥ 1 credit của phụ huynh. Lời mời được tạo `PENDING`, **trừ 1 credit** và ghi `CREDIT_TRANSACTIONS` (`amount: -1`, `type: USED_INVITATION`, `related_invitation_id`).
4. **Không hoàn credit** dù gia sư từ chối hoặc phụ huynh hủy.

Trả `201`: `{ invitation: { _id, status, message, created_at, request: { _id, title, subject_name }, tutor: { profile_id, full_name, headline } }, remaining_credits }`.

Cùng cơ chế an toàn với UC12: trừ credit có điều kiện, tạo lời mời trước rồi xóa nếu trừ thất bại.

## GET `/mine`
Lời mời đã gửi, mới nhất trước. Query: `status` (`PENDING|ACCEPTED|DECLINED|CANCELLED`), `page`, `limit`. Trả `{ items, pagination }`.

## PATCH `/:id/cancel`
Hủy lời mời `PENDING` → `CANCELLED`. **Không hoàn credit.** Không có body.

## Chat
`GET /mine` (phụ huynh) trả thêm `conversation_id` cho lời mời `ACCEPTED` có hội thoại đang mở; nhắn tin qua `/api/chat/v1` (xem [chat.md](chat.md)).

## Chưa làm
- Mời từ trang tìm kiếm / hồ sơ gia sư (chưa có UC); hiện chỉ mời từ màn gợi ý UC09.
- Màn Figma `hire-request` dẫn tới Checkout (thanh toán) mâu thuẫn với UC14 (trừ credit) nên làm theo tài liệu UC.


## Gia sư phản hồi lời mời (role `TUTOR`, cần có hồ sơ gia sư, nếu không 409)

### GET `/received`
Lời mời gia sư nhận được, mới nhất trước; **không gồm lời mời phụ huynh đã hủy** (lọc `status=CANCELLED` trả danh sách rỗng). Query: `status`, `page`, `limit`.

Item: `_id, status, message, created_at, conversation_id` (chỉ khi `ACCEPTED`), `request: { _id, title, subject_name, grade_level, teaching_mode, budget, location_address, is_available }`. **Không có thông tin phụ huynh** (tên, email, id) hay học sinh.

### PATCH `/:id/accept` · PATCH `/:id/decline`
Không có body; chỉ áp dụng cho lời mời `PENDING` của chính gia sư (lời mời của người khác hoặc đã bị hủy → 404; không còn `PENDING` → 409).

- **Accept**: lời mời → `ACCEPTED` và mở hội thoại 1-1 với phụ huynh đã mời (dùng lại nếu đã có). Request phải còn `OPEN` và chưa quá 30 ngày, nếu không 409 và lời mời giữ nguyên `PENDING`. **Request vẫn `OPEN`.**
- **Decline**: lời mời → `DECLINED` (không cần request còn mở).
- Credit của phụ huynh **không hoàn lại**. Phụ huynh không hủy được lời mời đã `ACCEPTED` / `DECLINED` (409).
- Hai thao tác đồng thời trên cùng một lời mời chỉ một thao tác thành công; các thao tác còn lại nhận 409.
