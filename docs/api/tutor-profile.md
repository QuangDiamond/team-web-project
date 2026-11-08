# Tutor Profile API (`/api/tutor-profile/v1`)

Hồ sơ gia sư của **chính mình**. Chỉ role `TUTOR`. Cần đăng nhập. Hồ sơ là điều kiện để duyệt request, ứng tuyển, nhận lời mời và đăng bài (các API đó trả 409 `Complete your tutor profile first` khi chưa có).

Middleware: authentication → authorize('TUTOR') → body validator (PUT) → controller.

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
- Bắt buộc: `headline` (≤ 120 ký tự), `bio` / About you (≤ 50 từ, đồng thời ≤ 2000 ký tự), `address` (≤ 255 ký tự). Từ được đếm theo khoảng trắng, xuống dòng hoặc tab. Mỗi mảng tối đa 10 mục, có thể để mảng rỗng.
- Khi thêm một mục: mọi field bắt buộc, trừ `description` (Details). Experience bắt buộc `title`, `company`, `start_date`, `end_date`; Education bắt buộc `school`, `degree`, `graduation_year`; Achievement bắt buộc `title`.
- `experiences[].end_date` không được trước `start_date`; `educations[].graduation_year` từ 1950 đến 2100.
- Experience cho phép chọn **Now** thay cho End date: gửi `end_date: null` để biểu thị công việc hiện tại. Không chọn Now thì phải gửi ngày kết thúc hợp lệ; không được bỏ field `end_date`.
- Body dùng `strictObject`: gửi `user_id`, `is_complete`, `average_rating`, `avatar_url`... bị từ chối (422). `user_id` lấy từ JWT, `average_rating` giữ nguyên, `is_complete` luôn là `true` sau khi lưu.
- Avatar dùng `POST /api/user/v1/me/avatar`; xem `avatar.md`. Chưa hỗ trợ tải ảnh bìa.

## Teaching categories

`teaching_categories` is an optional PUT field containing at most 50 unique selections:

```json
{ "teaching_categories": [{ "type": "subjects", "category_id": "507f1f77bcf86cd799439011" }, { "type": "grades", "category_id": "507f1f77bcf86cd799439012" }] }
```

The backend resolves names from SUBJECTS/GRADE_LEVELS; clients cannot supply names.
Unknown IDs, wrong category types, duplicates, and new inactive choices return 422.
Previously saved inactive choices may be retained or removed. Sending [] clears tags;
omitting the field preserves saved selections for older clients. Existing profiles
default to [] without rewriting stored documents.

GET/PUT profile responses and the public tutor profile include
`teaching_categories: [{type, category_id, name}]`. Public names use contact masking.
Referenced categories cannot be renamed/deleted by admins, including profile references.
The UI combines active subjects and levels in one searchable, multi-select dropdown;
public profiles render the selected names as tags. These tags do not create or edit tutor posts.
