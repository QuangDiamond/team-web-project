# AI Tutor Suggestions API (`/api/ai-suggestions/v1`) – UC09

Response chung: `{ "success": 1 | false, "message": "...", "data": ... }`.

Mọi endpoint cần đăng nhập (cookie `token` hoặc `Authorization: Bearer <token>`), chỉ dành cho role `PARENT` và chỉ với request **của chính parent đó** đang ở trạng thái `OPEN` (PRE-1, PRE-2).

> Middleware `authorize` chưa có (AGENTS.md: Planned) nên service tự kiểm tra role. Route có `// TODO: authorize('PARENT')`.

## Trạng thái hiện tại (quan trọng)

- **Chưa gọi AI provider nào.** Gợi ý chỉ dựa trên môn học và khối lớp (không chấm điểm, không trọng số); `ai_reason` luôn `null` và `ai_status = "FALLBACK"` (đúng luồng ngoại lệ E1 của UC09). Khi tích hợp AI sau này, chỉ cần điền `ai_reason` và đổi `ai_status` thành `"AI"`.
- Không gửi bất kỳ dữ liệu nào ra dịch vụ bên thứ ba, nên chưa trừ `ai_quota_used` (BR-13).

| Status | Khi nào |
|---|---|
| 200 | Thành công |
| 401 | Chưa đăng nhập / token hết hạn |
| 403 | `Only parent accounts can view tutor suggestions` |
| 404 | Request không tồn tại, id sai định dạng, hoặc thuộc parent khác |
| 409 | `Tutor suggestions are only available for open requests` |
| 422 | `page` / `limit` không hợp lệ; body của `refresh` có field lạ |

## GET `/requests/:requestId`

Query: `page` (mặc định 1), `limit` (mặc định 10, tối đa 100).

Dùng cache nếu còn hạn (`AI_SUGGESTIONS.cached_until`, 24 giờ), không thì tính mới và lưu cache. Tối đa 10 gia sư.

```json
{
  "request": { "_id": "...", "title": "...", "subject_name": "Toán", "grade_level": "Lớp 9", "teaching_mode": "OFFLINE", "budget": 200000 },
  "items": [
    {
      "_id": "...",
      "ai_reason": null,
      "tutor": { "profile_id": "...", "full_name": "...", "avatar_url": null, "headline": "...", "average_rating": 4.9, "availability_status": "AVAILABLE" },
      "post": { "_id": "...", "title": "...", "subject_name": "Toán", "grade_level": "Lớp 9", "teaching_mode": "OFFLINE", "price": 150000, "schedule": "..." }
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 3, "totalPages": 1 },
  "ai_status": "FALLBACK",
  "cached_until": "2026-11-05T03:00:00.000Z",
  "hint": null
}
```

Không có ứng viên (E2): `items = []`, `hint` báo chưa có gia sư dạy môn và khối này, không lưu cache. Cache còn hạn nhưng không còn dòng nào dùng được thì tự tính lại.

## POST `/requests/:requestId/refresh`

Bỏ cache và tính lại ngay. Body rỗng `{}`; field lạ (kể cả `weights` cũ) bị từ chối 422. Trả về cùng dạng như GET (trang 1).

## Quy tắc gợi ý

1. Chỉ xét bài đăng `PUBLISHED` của gia sư có tài khoản `ACTIVE`. Gia sư `NOT_AVAILABLE` vẫn được gợi ý (item có `tutor.availability_status` để UI hiện nhãn).
2. **Khớp theo môn học và khối lớp**, không xét hình thức học, giá hay lịch:
   - môn học trùng / chứa nhau (bỏ dấu, không phân biệt hoa thường)
   - khối lớp trùng theo số ("Lớp 9" khớp "9")
3. Mỗi gia sư chỉ giữ **bài đăng mới nhất** khớp request. Sắp xếp theo rating giảm dần, tối đa 10 gia sư.

Không có `match_score`, `breakdown` hay `weights`. Cột `match_score` / `weights_json` trong `AI_SUGGESTIONS` vẫn tồn tại nhưng được ghi `null`.
