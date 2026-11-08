# Agreements API (`/api/agreements/v1`) – UC16 Confirm Tutoring Agreement

Dành cho `PARENT` và `TUTOR` đã đăng nhập (bắt buộc middleware `authentication`).

## GET `/`
Trả về danh sách các thỏa thuận dạy học (`connections`) và các hội thoại 1-1 đang hoạt động (`activeConversations`) của người dùng hiện tại.

## POST `/propose`
Body: `{ "conversationId": "<ObjectId>", "agreedSubject": "Toán 9", "agreedSchedule": "Thứ 3 & Thứ 5", "agreedPrice": 250000 }`.
- Tạo bản ghi `TutoringAgreement` ở trạng thái `PENDING`.
- Gửi `Notification` (category `CONVERSATION`) cho đối tác trong hội thoại.

## POST `/:agreementId/confirm`
Body: `{ "action": "CONFIRM" | "REJECT" | "CANCEL" }`.
- `CONFIRM` (chỉ đối tác của người đề xuất): cập nhật trạng thái `CONFIRMED`, đóng `ParentRequest` liên quan (`CLOSED`), tự động đóng các thỏa thuận `DRAFT`/`PENDING` khác của cùng bài yêu cầu (`CANCELLED` nếu do phụ huynh đề xuất, `REJECTED` nếu do gia sư đề xuất), gửi thông báo cho cả hai bên.
- `REJECT` (chỉ đối tác của người đề xuất): cập nhật trạng thái `REJECTED`, gửi thông báo cho người đề xuất.
- `CANCEL` (UC16 A3 - chỉ chính người đề xuất): hủy đề xuất đang `PENDING`/`DRAFT` (`status = CANCELLED`).

## POST `/:agreementId/rate`
Body: `{ "rating": 5, "comment": "..." }`.
- Chỉ áp dụng cho thỏa thuận đã `CONFIRMED` chưa có đánh giá.
- Tạo bản ghi `Review` và cập nhật `average_rating` của `TutorProfile`.

