# Tutor Requests API (`/api/tutor-requests/v1`) – UC11 Browse Requests & AI Post Suggestions

Mọi endpoint cần đăng nhập, chỉ dành cho role `TUTOR`. Gia sư chưa có `TutorProfile` nhận **409** `Complete your tutor profile first` (hồ sơ là việc của UC khác, không tự tạo).

> Middleware `authorize` chưa có nên service tự kiểm tra role. Route có `// TODO: authorize('TUTOR')`.

| Status | Khi nào |
|---|---|
| 401 / 403 | Chưa đăng nhập / không phải TUTOR |
| 404 | Request không tồn tại, **không còn OPEN, hoặc quá 30 ngày**, hoặc id sai |
| 409 | Chưa có hồ sơ gia sư |
| 422 | Query không hợp lệ |

**Ẩn danh phụ huynh:** response không có tên, email, SĐT, `parent_user_id`, thông tin học sinh; chỉ có khu vực (`location_address`).

## GET `/`
Chỉ request `OPEN` và tạo trong 30 ngày gần nhất (BR-05), mới nhất trước. Query (bỏ field rỗng): `q` (tìm trong tiêu đề / môn / mô tả), `subject`, `grade`, `area`, `mode` (`ONLINE|OFFLINE|HYBRID`), `minBudget`, `maxBudget`, `page`, `limit`. Từ khóa được escape nên ký tự đặc biệt không gây lỗi regex.

Item: `_id, available, title, subject_name, grade_level, teaching_mode, budget, schedule, description, location_address, tutor_requirements, image_urls, application_count, is_bookmarked, has_applied, match_score (null ở danh sách thường), created_at`.

## GET `/filters`
`{ subjects: [], grades: [] }` lấy từ các request đang mở, để đổ vào dropdown lọc.

## GET `/:id`
Chi tiết một request đang mở (cùng dạng item).

## GET `/bookmarks`
Request đã lưu (`page`, `limit`), lưu gần nhất trước, thêm `saved_at`. Request đã đóng / hết hạn vẫn hiện nhưng `available = false` và chỉ còn `_id, title, subject_name`.

## PUT `/:id/bookmark`
Lưu request đang mở. Gọi nhiều lần vẫn chỉ có một bookmark (unique index + bắt lỗi trùng). Trả `{ is_bookmarked: true }`.

## DELETE `/:id/bookmark`
Bỏ lưu (chỉ xóa bookmark của chính gia sư). Gọi lặp lại vẫn 200. Trả `{ is_bookmarked: false }`.

## GET `/suggestions` · POST `/suggestions/refresh`
"Suggested for you": tối đa 10 request, điểm `match_score` 0–100, cache 24 giờ trong `AI_POST_SUGGESTIONS`; `refresh` bỏ cache và tính lại. Response: `{ items, pagination, ai_status, cached_until, hint }`.

- **Chưa gọi AI provider**: `ai_reason` luôn `null`, `ai_status = "FALLBACK"`.
- Thuộc tính của gia sư lấy từ các `TutorPost` **PUBLISHED** của họ (môn, khối, hình thức, giá, lịch) vì `TutorProfile` không có các trường này. Không có bài đăng → `items = []` và `hint` nhắc đăng bài.
- Ràng buộc cứng: môn, khối, hình thức. Điểm = giá bài đăng so với ngân sách (40), lịch (30), khu vực (30); rating của chính gia sư không được dùng.
- Bỏ qua request gia sư đã ứng tuyển (kể cả đã rút).
