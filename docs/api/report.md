# Report API (`/api/report/v1`) – UC38 người dùng báo cáo vi phạm

Theo SDS v0.16 mục 9.2 (`ReportRoutes` / `ReportService.createReport`). Admin xử lý báo cáo ở [`/api/moderation/v1`](moderation.md).

Middleware: `authentication` → `authorize('PARENT', 'TUTOR', 'STUDENT')` → `validator(reportSchema)`. Admin gọi → 403.

## POST `/`

Body:
```json
{ "target_type": "POST" | "REQUEST", "target_id": "<ObjectId>", "reason": "5–500 ký tự" }
```
- `POST`: bài đăng của gia sư (`TUTOR_POSTS`), phụ huynh báo cáo từ trang hồ sơ gia sư.
- `REQUEST`: yêu cầu tìm gia sư (`PARENT_REQUESTS`), gia sư báo cáo từ trang chi tiết yêu cầu hoặc hồ sơ phụ huynh.
- Hiện chỉ hỗ trợ 2 loại trên. `REVIEW` / `USER` / `CLASSROOM` trong SDS chưa làm; tin nhắn được báo cáo từ chat (UC32 A3).

Xử lý:
1. Nội dung phải tồn tại (404), không phải của chính người báo cáo (403).
2. Mỗi người chỉ có một báo cáo đang mở (`PENDING` / `INVESTIGATING`) cho cùng nội dung (409).
3. Tạo `ContentReport { status: PENDING, severity: MEDIUM }`.
4. Tạm ẩn nội dung: bài đăng `PUBLISHED → PENDING_MODERATION`, yêu cầu `OPEN → PENDING_MODERATION` (trang công khai chỉ hiện `PUBLISHED` / `OPEN`). Admin chọn `NONE` (không vi phạm) sẽ khôi phục; `CONTENT_HIDDEN` / `CONTENT_REMOVED` sẽ ẩn hoặc gỡ.
5. Thông báo cho tác giả ("... của bạn đang được kiểm duyệt") và mọi Admin `ACTIVE` ("Báo cáo vi phạm mới", deepLink `/admin/moderation`).

Response `201`:
```json
{ "success": 1, "message": "Đã gửi báo cáo. Admin sẽ xem xét nội dung này.", "data": { "_id": "...", "target_type": "REQUEST", "status": "PENDING", "severity": "MEDIUM", "...": "..." } }
```

Mã lỗi: `401` chưa đăng nhập, `403` role Admin hoặc tự báo cáo, `404` không tìm thấy nội dung, `409` đã báo cáo và đang chờ xử lý, `422` body không hợp lệ.

## Frontend
`components/common/ReportContentButton.jsx` (nút "Báo cáo" + hộp thoại chọn lý do), gọi `services/reportService.js`:
- Gia sư: trang `/tutor/requests/:id` và danh sách yêu cầu trên hồ sơ phụ huynh `/parents/:userId`.
- Phụ huynh: mục "Bài đăng và lịch dạy" trên hồ sơ gia sư `/tutors/:profileId`.
