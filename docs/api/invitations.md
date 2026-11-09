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
Body: `{ "request_id": "<ObjectId>", "tutor_profile_id": "<ObjectId>", "message": "tùy chọn, ≤ 500 ký tự", "credits": 1 }`. `credits` là số nguyên từ 1 đến 10, mặc định 1; sai kiểu hoặc ngoài khoảng → 422.

Quy tắc:
1. `request_id` phải là request **của chính phụ huynh**, đang `OPEN` và chưa quá 30 ngày.
2. Mỗi gia sư chỉ được mời **một lần** cho mỗi request (unique `{request_id, tutor_profile_id}`).
3. Cần đủ `credits` credit của phụ huynh (mặc định 1). Lời mời được tạo `PENDING`, **trừ `credits` credit** và ghi `CREDIT_TRANSACTIONS` (`amount: -credits`, `type: USED_INVITATION`, `related_invitation_id`).
4. **Ưu tiên:** lời mời dùng nhiều credit hơn được xếp lên đầu danh sách lời mời nhận được của gia sư (`GET /received`: `credits_spent` giảm dần, rồi mới nhất). Lời mời cũ chưa có `credits_spent` coi như 1.
5. **Không hoàn credit** dù gia sư từ chối hoặc phụ huynh hủy.

Trả `201`: `{ invitation: { _id, status, message, credits_spent, created_at, request: { _id, title, subject_name }, tutor: { profile_id, full_name, headline } }, remaining_credits }`.

Cùng cơ chế an toàn với UC12: trừ credit có điều kiện, tạo lời mời trước rồi xóa nếu trừ thất bại.

## GET `/tutors`
Danh sách gia sư đang hoạt động để phụ huynh xem và mời (role `PARENT`). Chỉ gồm gia sư có tài khoản `ACTIVE` và hồ sơ đã hoàn thiện (`is_complete`), rating cao trước. Query: `q` (tìm theo tên, tối đa 100 ký tự), `page`, `limit`. Trả `{ items, pagination }`, mỗi item:

```json
{ "profile_id": "...", "full_name": "...", "avatar_url": null, "headline": "...", "average_rating": 4.5, "availability_status": "AVAILABLE", "subjects": ["Toán"], "min_price": 250000 }
```

`subjects` và `min_price` lấy từ các bài đăng `PUBLISHED` của gia sư (rỗng / `null` nếu chưa có). Không trả email, số điện thoại; tên và headline được che email / số điện thoại / link như hồ sơ công khai. Xem chi tiết một gia sư: `GET /api/discovery/v1/tutors/:profileId` (trang `/tutors/:profileId`).

## GET `/mine`
Lời mời đã gửi, mới nhất trước. Query: `status` (`PENDING|ACCEPTED|DECLINED|CANCELLED`), `page`, `limit`. Trả `{ items, pagination }`.

## PATCH `/:id/cancel`
Hủy lời mời `PENDING` → `CANCELLED`. **Không hoàn credit.** Không có body.

## Chat
`GET /mine` (phụ huynh) trả thêm `conversation_id` cho lời mời `ACCEPTED` có hội thoại đang mở; nhắn tin qua `/api/chat/v1` (xem [chat.md](chat.md)).

## Chưa làm
- Mời từ trang tìm kiếm nâng cao (lọc theo môn, khối, giá): hiện chỉ có tìm theo tên. Có thể mời từ danh sách `/tutors`, hồ sơ gia sư và màn gợi ý UC09.
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
