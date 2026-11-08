# Tutor Requests API (`/api/tutor-requests/v1`) — Browse Requests & Suggestions

Mọi endpoint cần đăng nhập, chỉ dành cho role `TUTOR`. Gia sư chưa có `TutorProfile` nhận **409** `Complete your tutor profile first` (hồ sơ là việc của UC khác, không tự tạo).

Middleware authentication → authorize('TUTOR') protects all routes. Suggestion refresh validates an empty body.

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
Gợi ý từ `TutorProfile.teaching_categories`, dùng cùng bộ quy tắc và nguồn danh mục đang bật như phía Parent.

- Hồ sơ phải hoàn thiện và chọn cả môn học (`subjects`) lẫn cấp học/trình độ (`grades`). Nếu thiếu, trả danh sách rỗng và hint cập nhật hồ sơ.
- Đối chiếu chính xác tên chuẩn hóa (bỏ dấu/khác biệt chữ hoa), bao gồm IELTS, TOEIC... Không suy diễn các số trong tên chứng chỉ thành khối lớp.
- Chỉ yêu cầu OPEN, chưa quá 30 ngày; bỏ yêu cầu đã có đơn ứng tuyển chưa WITHDRAWN của tutor. Yêu cầu đã rút đơn có thể được gợi ý lại như trước.
- Mỗi yêu cầu xuất hiện một lần, mới nhất trước; `_id` giảm dần để ổn định khi trùng thời gian.
- GET nhận page/limit, phân trang toàn bộ kết quả, không cắt top 10 trước khi phân trang.
- POST refresh nhận body rỗng/`{}`, trả trang 1 với limit 10. FE refresh dùng GET vì không còn cache.
- Response `{ items, pagination, hint }`; item giữ dữ liệu request, trạng thái bookmark và application_count hiện có. Không trả ai_status/cached_until.
- Không cần bài đăng, không gọi AI, không trừ quota hay credits khi xem/làm mới. Ứng tuyển vẫn theo luồng credits hiện có.
- Không đọc/ghi/xóa cache AI_POST_SUGGESTIONS cũ. Không migrate hoặc xóa dữ liệu lịch sử.
- Mỗi môn và trình độ được chọn áp dụng độc lập (mọi tổ hợp), giống gợi ý Parent; hiện không có cặp môn-trình độ riêng.

Frontend: `/tutor/requests/suggested`, nhãn sidebar/header và phần xem nhanh dashboard đều là **Gợi ý**. Trang có liên kết cập nhật danh mục giảng dạy trong hồ sơ.
