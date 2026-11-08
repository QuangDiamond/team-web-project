# Applications API (`/api/applications/v1`) – UC12 Apply to Request

Chỉ dành cho role `TUTOR` có `TutorProfile` (không có hồ sơ → 409). Có `// TODO: authorize('TUTOR')` ở route.

| Status | Khi nào |
|---|---|
| 201 / 200 | Thành công |
| 402 | `Not enough credits` |
| 404 | Request không tồn tại, không còn OPEN hoặc quá 30 ngày; đơn không thuộc gia sư này |
| 409 | Đang ứng tuyển request này (đơn chưa rút); đơn không còn ở `PENDING`; chưa có hồ sơ gia sư |
| 422 | Body không hợp lệ (`request_id` sai, `note` > 500 ký tự, field lạ như `tutor_profile_id`/`status`) |

## POST `/`
Body: `{ "request_id": "<ObjectId>", "note": "lời nhắn ngắn (tùy chọn, ≤ 500 ký tự)", "credits": 1 }`. `credits` là số nguyên từ 1 đến 10, mặc định 1; sai kiểu hoặc ngoài khoảng → 422.

Quy tắc:
1. Request phải `OPEN` và tạo trong 30 ngày gần nhất.
2. Mỗi gia sư ứng tuyển một request **một lần** (unique `{request_id, tutor_profile_id}`).
3. Cần đủ `credits` credit (mặc định 1). Đơn được tạo `PENDING`, **trừ `credits` credit** và ghi `CREDIT_TRANSACTIONS` (`amount: -credits`, `type: USED_APPLY`, `related_apply_id`).
4. **Ưu tiên:** đơn dùng nhiều credit hơn được xếp lên đầu danh sách đơn của phụ huynh (`GET /api/parent-requests/v1/:id/applications`: `credits_spent` giảm dần, rồi `match_score`, rồi mới nhất). Đơn cũ chưa có `credits_spent` coi như 1.
5. **Không hoàn credit** dù phụ huynh bỏ qua đơn hoặc gia sư rút đơn.

Trả `201`: `{ application: { _id, status, note, credits_spent, created_at, request: { _id, title, subject_name, status, is_available } }, remaining_credits }`.

Trừ credit là một phép cập nhật có điều kiện (`balance >= credits`), nên nhiều request song song không làm số dư âm. DB local là standalone (không có transaction): đơn được tạo trước, trừ credit thất bại thì đơn bị xóa.

## GET `/mine`
Đơn của chính gia sư, mới nhất trước. Query: `status` (`PENDING|CONTINUED|SKIPPED|WITHDRAWN`), `page`, `limit`. Trả `{ items, pagination }`.

## PATCH `/:id/withdraw`
Rút đơn `PENDING` → `WITHDRAWN`. **Không hoàn credit.** Sau khi rút, gia sư được ứng tuyển lại request đó bằng `POST /`: đơn cũ được kích hoạt lại thành `PENDING` với lời nhắn và số credit mới, `created_at` được làm mới và **trừ credit lần nữa** (nếu không đủ credit thì đơn vẫn ở `WITHDRAWN` như cũ). Không có body.

## GET `/api/parent-requests/v1/:id/applications` (phụ huynh duyệt đơn)
Chỉ chủ request (role `PARENT`; request của người khác → 404). Query: `page`, `limit`. **Không gồm đơn đã rút.** Sắp xếp: `credits_spent` giảm dần (đơn cũ chưa có field coi như 1), bằng nhau thì mới nhất trước.

```json
{
  "request": { "_id": "...", "title": "...", "subject_name": "Toán", "status": "OPEN" },
  "items": [
    {
      "_id": "...", "status": "PENDING", "note": "...", "credits_spent": 1, "created_at": "...", "conversation_id": null,
      "tutor": { "profile_id": "...", "full_name": "...", "headline": "...", "average_rating": 4.5, "avatar_url": null, "is_active": true }
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 }
}
```
`conversation_id` chỉ có giá trị khi đơn đã `CONTINUED`.

## PATCH `/:id/continue` · PATCH `/:id/skip` (phụ huynh)
Không có body. Chỉ áp dụng cho đơn `PENDING` thuộc request của phụ huynh.

| Status | Khi nào |
|---|---|
| 200 | Thành công |
| 403 | Không phải PARENT |
| 404 | Đơn không tồn tại hoặc không thuộc request của phụ huynh |
| 409 | Đơn không còn `PENDING`; (continue) request không còn OPEN / quá 30 ngày hoặc tài khoản gia sư không còn `ACTIVE` |

- **Continue**: đơn → `CONTINUED` và mở hội thoại 1-1 (`CONVERSATIONS`, `type: DIRECT`, `is_active: true`) giữa phụ huynh và gia sư cho request này. Dùng lại hội thoại nếu đã có (ví dụ gia sư cũng đã nhận lời mời). **Request vẫn `OPEN`** để còn xem thêm ứng viên khác. Trả đơn kèm `conversation_id`.
- **Skip**: đơn → `SKIPPED`, không tạo hội thoại.
- Credit của gia sư **không hoàn lại** ở cả hai trường hợp, và không trừ thêm.
- Hai thao tác đồng thời trên cùng một đơn chỉ một thao tác thành công (điều kiện `status: PENDING` trong câu cập nhật); các thao tác còn lại nhận 409. Nếu mở hội thoại lỗi, đơn được trả về `PENDING`.

## Chat
`GET /mine` (gia sư) trả thêm `conversation_id` cho đơn `CONTINUED` có hội thoại đang mở; phụ huynh nhắn tin với gia sư qua `/api/chat/v1` (xem [chat.md](chat.md)).

## Chưa làm
Tin nhắn dạng ảnh / file.
