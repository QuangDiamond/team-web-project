# AI Tutor Suggestions API (`/api/ai-suggestions/v1`) – UC09

Response chung: `{ "success": 1 | false, "message": "...", "data": ... }`.

Mọi endpoint cần đăng nhập (cookie `token` hoặc `Authorization: Bearer <token>`), chỉ dành cho role `PARENT` và chỉ với request **của chính parent đó** đang ở trạng thái `OPEN` (PRE-1, PRE-2).

> Middleware `authorize` chưa có (AGENTS.md: Planned) nên service tự kiểm tra role. Route có `// TODO: authorize('PARENT')`.

## Trạng thái hiện tại (quan trọng)

- **Chưa gọi AI provider nào.** Gợi ý được xếp hạng hoàn toàn bằng luật; `ai_reason` luôn `null` và `ai_status = "FALLBACK"` (đúng luồng ngoại lệ E1 của UC09). Khi tích hợp AI sau này, chỉ cần điền `ai_reason` và đổi `ai_status` thành `"AI"`.
- Không gửi bất kỳ dữ liệu nào ra dịch vụ bên thứ ba, nên chưa trừ `ai_quota_used` (BR-13).

| Status | Khi nào |
|---|---|
| 200 | Thành công |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | `Only parent accounts can view tutor suggestions` |
| 404 | Request không tồn tại, id sai định dạng, hoặc thuộc parent khác |
| 409 | `Tutor suggestions are only available for open requests` |
| 422 | `page` / `limit` / `weights` không hợp lệ |

## GET `/requests/:requestId`

Query: `page` (mặc định 1), `limit` (mặc định 10, tối đa 100).

Dùng cache nếu còn hạn (`AI_SUGGESTIONS.cached_until`, 24 giờ), không thì tính mới và lưu cache. Tối đa 10 gia sư.

```json
{
  "request": { "_id": "...", "title": "...", "subject_name": "Toán", "grade_level": "Lớp 9", "teaching_mode": "OFFLINE", "budget": 200000 },
  "items": [
    {
      "_id": "...",
      "match_score": 96.5,
      "ai_reason": null,
      "breakdown": { "budget": 100, "rating": 98, "schedule": 100, "area": 80 },
      "tutor": { "profile_id": "...", "full_name": "...", "avatar_url": null, "headline": "...", "average_rating": 4.9 },
      "post": { "_id": "...", "title": "...", "subject_name": "Toán", "grade_level": "Lớp 9", "teaching_mode": "OFFLINE", "price": 150000, "schedule": "..." }
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 },
  "ai_status": "FALLBACK",
  "weights": { "budget": 35, "rating": 25, "schedule": 20, "area": 20 },
  "cached_until": "2026-11-05T03:00:00.000Z",
  "hint": null
}
```

Không có ứng viên (E2): `items = []`, `hint` gợi ý nới tiêu chí, không lưu cache.

## POST `/requests/:requestId/refresh` (A1 – Refine)

Bỏ cache và tính lại với trọng số mới. Body (tất cả tùy chọn, mỗi trọng số 0–100, ít nhất một trọng số > 0; field lạ bị từ chối):

```json
{ "weights": { "budget": 60, "rating": 40, "schedule": 0, "area": 0 } }
```

Trả về cùng dạng như GET (trang 1).

## Quy tắc xếp hạng

1. **Ràng buộc cứng** (bài đăng `PUBLISHED`, gia sư không `NOT_AVAILABLE`, tài khoản `ACTIVE`):
   - môn học trùng / chứa nhau (bỏ dấu, không phân biệt hoa thường)
   - khối lớp trùng theo số ("Lớp 9" khớp "9")
   - hình thức học tương thích (trùng nhau, hoặc một bên là `HYBRID`)
2. **Điểm 0–100** là trung bình có trọng số của: `budget` (giá ≤ ngân sách = 100, vượt thì giảm tuyến tính), `rating` (sao/5), `schedule` và `area` (độ trùng từ khóa của hai đoạn văn bản tự do). Thiếu dữ liệu thì tính trung bình (50). Request `ONLINE` bỏ thành phần `area` và chia lại trọng số.
3. Mỗi gia sư chỉ giữ **bài đăng có điểm cao nhất**; bằng điểm thì ai rating cao hơn xếp trước.

### Khác với đặc tả UC09

- **Bỏ "response rate"**: hệ thống chưa lưu dữ liệu này.
- **`area` là thành phần chấm điểm chứ không phải ràng buộc cứng**: địa chỉ là văn bản tự do, lọc cứng sẽ loại nhầm gần hết gia sư.
- `schedule` và `area` chỉ so khớp từ khóa, chưa hiểu được khung giờ hay quận/huyện cụ thể.
