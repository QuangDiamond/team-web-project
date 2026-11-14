# Tutor Requests API (`/api/tutor-requests/v1`) — Browse Requests & Suggestions

Mọi endpoint cần đăng nhập, chỉ dành cho role `TUTOR`, trừ `GET /` (công khai, xem bên dưới). Gia sư chưa có `TutorProfile` nhận **409** `Complete your tutor profile first` (hồ sơ là việc của UC khác, không tự tạo).

Middleware authentication → authorize('TUTOR') protects all routes except `GET /` (optionalAuthentication). Suggestion refresh validates an empty body.

| Status | Khi nào |
|---|---|
| 401 / 403 | Chưa đăng nhập / không phải TUTOR |
| 404 | Request không tồn tại, **không còn OPEN, hoặc quá 30 ngày**, hoặc id sai |
| 409 | Chưa có hồ sơ gia sư |
| 422 | Query không hợp lệ |

**Ẩn danh phụ huynh:** response không có tên, email, SĐT, `parent_user_id`, thông tin học sinh; chỉ có khu vực (`location_address`).

## GET `/`
**Công khai** (không bắt buộc đăng nhập, dùng cho trang `/requests` ngoài trang chủ). Có token thì xác thực như thường; chỉ gia sư mới có `is_bookmarked` / `has_applied` thật, khách và role khác luôn nhận `false`.

Chỉ request `OPEN` và tạo trong 30 ngày gần nhất (BR-05), mới nhất trước. Query (bỏ field rỗng): `q` (tìm trong tiêu đề / môn / mô tả), `subject`, `grade`, `area`, `mode` (`ONLINE|OFFLINE|HYBRID`), `minBudget`, `maxBudget`, `page`, `limit`. Từ khóa được escape nên ký tự đặc biệt không gây lỗi regex.

Item: `_id, available, title, subject_name, grade_level, teaching_mode, budget, schedule, description, location_address, tutor_requirements, image_urls, application_count, is_bookmarked, has_applied, match_score (null ở danh sách thường), created_at`.

## GET `/filters`
`{ subjects: [], grades: [] }` lấy từ các request đang mở, để đổ vào dropdown lọc.

## GET `/:id`
Chi tiết một request đang mở (cùng dạng item), thêm trường `invitation`: lời mời của phụ huynh gửi cho chính gia sư này về request, dạng `{ _id, status, message, credits_spent, created_at }`, hoặc `null` nếu không có (lời mời đã bị phụ huynh hủy cũng trả `null`).

## GET `/bookmarks`
Request đã lưu (`page`, `limit`), lưu gần nhất trước, thêm `saved_at`. Request đã đóng / hết hạn vẫn hiện nhưng `available = false` và chỉ còn `_id, title, subject_name`.

## PUT `/:id/bookmark`
Lưu request đang mở. Gọi nhiều lần vẫn chỉ có một bookmark (unique index + bắt lỗi trùng). Trả `{ is_bookmarked: true }`.

## DELETE `/:id/bookmark`
Bỏ lưu (chỉ xóa bookmark của chính gia sư). Gọi lặp lại vẫn 200. Trả `{ is_bookmarked: false }`.

## GET `/suggestions` · POST `/suggestions/refresh`
Gợi ý theo **hồ sơ** (`TutorProfile.teaching_categories`, danh mục đang bật) **hoặc bài đăng** `PUBLISHED` của gia sư.

- Hồ sơ phải hoàn thiện, và gia sư phải có ít nhất một danh mục giảng dạy đang bật hoặc một bài đăng `PUBLISHED`. Nếu thiếu, trả danh sách rỗng và hint cập nhật hồ sơ / đăng bài.
- Một yêu cầu phù hợp khi khớp **cả môn học VÀ khối lớp**, theo một trong hai nguồn: (1) hồ sơ có cả môn và trình độ của yêu cầu; (2) một bài đăng `PUBLISHED` cùng môn và khối. Chỉ khớp một trong hai thì không gợi ý. Cùng quy tắc với phía phụ huynh.
- Đối chiếu chính xác tên chuẩn hóa (bỏ dấu/khác biệt chữ hoa), bao gồm IELTS, TOEIC... Không suy diễn các số trong tên chứng chỉ thành khối lớp.
- Chỉ yêu cầu OPEN, chưa quá 30 ngày; bỏ yêu cầu đã có đơn ứng tuyển chưa WITHDRAWN của tutor. Yêu cầu đã rút đơn có thể được gợi ý lại như trước.
- Mỗi yêu cầu xuất hiện một lần, mới nhất trước; `_id` giảm dần để ổn định khi trùng thời gian.
- GET nhận page/limit, phân trang toàn bộ kết quả, không cắt top 10 trước khi phân trang.
- POST refresh nhận body rỗng/`{}`, trả trang 1 với limit 10. FE refresh dùng GET vì không còn cache.
- Response `{ items, pagination, hint }`; item giữ dữ liệu request, trạng thái bookmark và application_count hiện có. Không trả ai_status/cached_until.
- Không gọi AI, không trừ quota hay credits khi xem/làm mới. Ứng tuyển vẫn theo luồng credits hiện có.
- Không đọc/ghi/xóa cache AI_POST_SUGGESTIONS cũ. Không migrate hoặc xóa dữ liệu lịch sử.

Frontend: `/tutor/requests/suggested`, nhãn sidebar/header và phần xem nhanh dashboard đều là **Gợi ý**. Trang có liên kết cập nhật danh mục giảng dạy trong hồ sơ.
