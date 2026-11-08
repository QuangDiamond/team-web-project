# Tutor Profile API (`/api/tutor-profile/v1`)

Hồ sơ gia sư của **chính mình**. Chỉ role `TUTOR`. Cần đăng nhập. Hồ sơ là điều kiện để duyệt request, ứng tuyển, nhận lời mời và đăng bài (các API đó trả 409 `Complete your tutor profile first` khi chưa có).

> Middleware `authorize` chưa có (AGENTS.md: Planned) nên service tự kiểm tra role; route có `// TODO: authorize('TUTOR')`.

| Status | Khi nào |
|---|---|
| 200 / 201 | Thành công (201 khi tạo hồ sơ lần đầu) |
| 401 | Chưa đăng nhập |
| 403 | Không phải TUTOR |
| 409 | Hai lần lưu đầu tiên đồng thời (unique `user_id`), thử lại sau khi tải lại |
| 422 | Dữ liệu không hợp lệ |

## GET `/me`
```json
{ "profile": null, "full_name": "Nguyen Van A" }
```
Chưa có hồ sơ thì `profile = null` (không phải lỗi). Khi có hồ sơ:
```json
{
  "profile": {
    "_id": "...", "headline": "...", "bio": "...", "address": "...",
    "is_address_hidden": false, "is_complete": true, "availability_status": "AVAILABLE", "average_rating": 4.5,
    "experiences": [{ "title": "...", "company": null, "start_date": "2020-09-01", "end_date": null }],
    "educations": [{ "school": "...", "degree": null, "graduation_year": 2020, "description": null }],
    "achievements": [{ "title": "...", "description": null }]
  },
  "full_name": "Nguyen Van A"
}
```

## PUT `/me`
Tạo hồ sơ lần đầu hoặc **ghi đè** toàn bộ nội dung hồ sơ (mảng `experiences`, `educations`, `achievements` được thay bằng mảng gửi lên).

```json
{
  "headline": "Gia sư Toán 5 năm kinh nghiệm",
  "bio": "Giới thiệu",
  "address": "Cầu Giấy, Hà Nội",
  "is_address_hidden": false,
  "availability_status": "AVAILABLE | NOT_AVAILABLE",
  "experiences": [{ "title": "Giáo viên", "company": "THCS ABC", "start_date": "2020-09-01", "end_date": "2023-06-30" }],
  "educations": [{ "school": "ĐH Sư phạm", "degree": "Cử nhân Toán", "graduation_year": 2020, "description": null }],
  "achievements": [{ "title": "Giải Nhất HSG", "description": "2018" }]
}
```
- Bắt buộc: `headline` (≤ 120), `bio` (≤ 2000), `address` (≤ 255). Mỗi mảng tối đa 10 mục.
- `experiences[].end_date` không được trước `start_date`; `educations[].graduation_year` từ 1950 đến 2100.
- Body dùng `strictObject`: gửi `user_id`, `is_complete`, `average_rating`, `avatar_url`... bị từ chối (422). `user_id` lấy từ JWT, `average_rating` giữ nguyên, `is_complete` luôn là `true` sau khi lưu.
- Chưa hỗ trợ tải ảnh đại diện / ảnh bìa.
