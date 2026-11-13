# Agreements API (`/api/agreements/v1`) – UC16 Confirm Tutoring Agreement

Dành cho `PARENT` và `TUTOR` đã đăng nhập: `authentication` → `authorize('PARENT', 'TUTOR')` (role khác → 403). Riêng `/:agreementId/rate` chỉ `authorize('PARENT')`.

## GET `/`
Trả về danh sách các thỏa thuận dạy học (`connections`) và các hội thoại 1-1 đang hoạt động (`activeConversations`) của người dùng hiện tại.

`activeConversations` bổ sung `request_id` (string hoặc null nếu yêu cầu không còn) và `grade_level` (string).
Các trường `_id`, `request_title`, `subject_name`, `schedule`, `budget`, `parent_name`, `tutor_name` giữ nguyên.
Chỉ hội thoại DIRECT của người đang đăng nhập được trả về như trước.

Ở `/parent/contracts`, modal đề xuất nhóm hội thoại theo `request_id` để chọn yêu cầu trước,
sau đó chọn gia sư đã kết nối với đúng yêu cầu đó. Yêu cầu không có hội thoại hoạt động chưa được chọn để tạo thỏa thuận.
Môn/trình độ, ngân sách và lịch được điền từ yêu cầu đã đăng; người dùng được chỉnh sửa.
Dropdown gia sư vẫn gửi `conversationId` theo contract POST cũ, backend tiếp tục kiểm tra quyền thành viên.
Lịch dùng lại bộ chọn ngày và giờ của form yêu cầu, đọc được lịch chuẩn AM/PM và lịch cũ tiếng Việt dạng 24 giờ.

## POST `/propose`
Body: `{ "conversationId": "<ObjectId>", "agreedSubject": "Toán 9", "agreedSchedule": "Thứ 3 & Thứ 5", "agreedPrice": 250000 }`.
- Tạo bản ghi `TutoringAgreement` ở trạng thái `PENDING`.
- Gửi `Notification` (category `CONVERSATION`) cho đối tác trong hội thoại.

## POST `/:agreementId/confirm`
Body: `{ "action": "CONFIRM" | "REJECT" | "CANCEL" }`.
- `CONFIRM` (chỉ đối tác của người đề xuất): cập nhật trạng thái `CONFIRMED`, đóng `ParentRequest` liên quan (`CLOSED`), tự động đóng các thỏa thuận `DRAFT`/`PENDING` khác của cùng bài yêu cầu (`CANCELLED` nếu do phụ huynh đề xuất, `REJECTED` nếu do gia sư đề xuất), gửi thông báo cho cả hai bên.
- `REJECT` (chỉ đối tác của người đề xuất): cập nhật trạng thái `REJECTED`, gửi thông báo cho người đề xuất.
- `CANCEL` (UC16 A3 - chỉ chính người đề xuất): hủy đề xuất đang `PENDING`/`DRAFT` (`status = CANCELLED`).
- Đổi trạng thái có điều kiện theo status hiện tại: hai thao tác đồng thời trên cùng thỏa thuận thì thao tác sau nhận 409.
- `CONFIRM` khi bài yêu cầu đã `CLOSED` (ví dụ thỏa thuận khác của cùng yêu cầu vừa được xác nhận) → 409 (UC16 E1); thỏa thuận giữ nguyên `PENDING`.
- Ngoài trang `/parent/contracts`, form đề xuất còn mở được từ header khung chat 1-1 (SC11), chọn sẵn hội thoại hiện tại.

## POST `/:agreementId/rate`
Body: `{ "rating": 5, "comment": "..." }`.
- Chỉ áp dụng cho thỏa thuận đã `CONFIRMED` chưa có đánh giá.
- Tạo bản ghi `Review` và cập nhật `average_rating` của `TutorProfile`.

