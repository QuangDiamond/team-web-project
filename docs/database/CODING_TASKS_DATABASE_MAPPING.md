# Database Mapping & Data Dictionary for Coding Tasks (Chiến)

Tài liệu chi tiết Description & Purpose (Lý do lưu trữ), Ý nghĩa trong Use Case và Lý do cần thiết của từng trường dữ liệu tương ứng với các Use Case trong danh sách coding tasks của **Chiến**.

---

## TASK #4.3.4: UC15 – RESPOND TO INTERESTED TUTOR (PHỤ HUYNH PHẢN HỒI GIA SƯ)

### 1. Entity: INTERESTED_TUTORS (Mongoose Model: `ApplyRequest`, Collection: `APPLY_REQUESTS`)
- `interest_id` / `_id` (String / ObjectId, PK):
  - **Mô tả & Mục đích lưu trữ:** Khóa chính định danh duy nhất cho từng lượt ứng tuyển/bày tỏ quan tâm từ gia sư.
  - **Ý nghĩa & Lý do UC15 cần:** Quản lý riêng biệt từng bản ghi gia sư bày tỏ quan tâm đến bài yêu cầu; giúp phụ huynh xác định chính xác hồ sơ đang tương tác trên màn hình danh sách SC17.
- `request_id` (ObjectId, FK -> `PARENT_REQUESTS`):
  - **Mô tả & Mục đích lưu trữ:** Liên kết với bài đăng tìm gia sư gốc của phụ huynh.
  - **Ý nghĩa & Lý do UC15 cần:** Xác định danh sách gia sư này đang ứng tuyển vào bài yêu cầu cụ thể nào của phụ huynh; lọc các gia sư theo từng yêu cầu tìm kiếm.
- `tutor_profile_id` (ObjectId, FK -> `TUTOR_PROFILES`):
  - **Mô tả & Mục đích lưu trữ:** Mã định danh hồ sơ gia sư đã gửi yêu cầu ứng tuyển.
  - **Ý nghĩa & Lý do UC15 cần:** Xác định danh tính gia sư cụ thể mà phụ huynh đang xem xét phản hồi để hiển thị thông tin chi tiết và xử lý kết nối.
- `note` (String, Optional):
  - **Mô tả & Mục đích lưu trữ:** Lời nhắn / giới thiệu ngắn gọn từ gia sư khi bấm quan tâm.
  - **Ý nghĩa & Lý do UC15 cần:** Giúp phụ huynh nắm bắt thông điệp ban đầu của gia sư.
- `match_score` (Double):
  - **Mô tả & Mục đích lưu trữ:** Điểm số tương thích tính toán cho màn hình SC17.
  - **Ý nghĩa & Lý do UC15 cần:** Hỗ trợ phụ huynh lọc và ưu tiên các ứng viên phù hợp nhất.
- `status` (Enum: `PENDING`, `CONTINUED`, `SKIPPED`, `WITHDRAWN`, Default: `PENDING`):
  - **Mô tả & Mục đích lưu trữ:** Trạng thái tiếp nhận và xử lý hồ sơ ứng tuyển của phụ huynh.
  - **Ý nghĩa & Lý do UC15 cần:** Ban đầu là `PENDING`, cập nhật sang `CONTINUED` khi phụ huynh bấm chấp nhận tiếp tục trao đổi (POST-1), hoặc chuyển sang `SKIPPED` khi chọn bỏ qua ứng viên (Alternative Flow A1).

### 2. Entity: PROFILES / TUTOR_PROFILES (Mongoose Model: `TutorProfile`, Collection: `TUTOR_PROFILES`)
- `_id` (ObjectId, PK): Khóa chính định danh hồ sơ công khai của gia sư.
- `user_id` (ObjectId, FK trỏ đến `User`): Khóa ngoại liên kết 1-1 với tài khoản người dùng hệ thống. Dùng để truy xuất ví Credit và kích hoạt gửi thông báo.
- `is_complete` (Boolean): Kiểm tra hồ sơ gia sư đã hoàn thiện hay chưa.
- `availability_status` (Enum: `AVAILABLE`, `BUSY`, `INACTIVE`): Trạng thái sẵn sàng nhận lớp của gia sư.

### 3. Entity: USER_CREDITS (Model: `User` -> subdocument `credit_wallet` & `CreditTransaction`)
- `User.credit_wallet.balance` (Int, Default: 0):
  - **Mô tả & Mục đích lưu trữ:** Số dư Connection Credit khả dụng của gia sư.
  - **Ý nghĩa & Lý do UC15 cần:** Kiểm tra điều kiện gia sư còn tối thiểu 1 credit hay không trước khi mở kết nối; tự động trừ 1 credit khi phụ huynh bấm "Continue" (POST-1, E1).
- `CREDIT_TRANSACTIONS` (Model: `CreditTransaction`):
  - `user_id`: ID tài khoản gia sư.
  - `amount`: `-1`.
  - `type`: `'USED_APPLY'`.
  - `related_apply_id`: ID lượt ứng tuyển.

### 4. Entity: CONVERSATIONS (Mongoose Model: `Conversation`, Collection: `CONVERSATIONS`)
- `_id` (ObjectId, PK): Khóa chính định danh phòng chat trực tiếp 1-1.
- `request_id` (ObjectId, FK): Tham chiếu đến bài yêu cầu tìm gia sư gốc.
- `parent_user_id` (ObjectId, FK): Định danh tài khoản phụ huynh trong phòng chat.
- `tutor_profile_id` (ObjectId, FK): Định danh hồ sơ gia sư tham gia hội thoại.
- `type` (Enum: `DIRECT`, `CLASS_GROUP_CHAT`): Ở đây là `'DIRECT'`.
- `is_active` (Boolean, Default: `true`): Cờ trạng thái phòng chat đang hoạt động để hai bên gửi tin nhắn ngay sau khi bấm "Continue".

---

## TASK #4.3.6: UC17 – RESPOND TO INVITATION (GIA SƯ PHẢN HỒI LỜI MỜI DẠY)

### 1. Entity: TUTOR_INVITATIONS (Mongoose Model: `TutorInvitation`, Collection: `TUTOR_INVITATIONS`)
- `_id` (ObjectId, PK): Khóa chính định danh duy nhất cho từng bản ghi lời mời dạy từ phụ huynh.
- `parent_user_id` (ObjectId, FK trỏ đến `User`): ID tài khoản phụ huynh gửi lời mời.
- `tutor_profile_id` (ObjectId, FK trỏ đến `TutorProfile`): ID hồ sơ gia sư được mời.
- `request_id` (ObjectId, FK trỏ đến `ParentRequest`): ID bài yêu cầu tìm gia sư đính kèm trong lời mời.
- `message` (String, Optional): Lời nhắn gửi kèm của phụ huynh.
- `status` (Enum: `PENDING`, `ACCEPTED`, `DECLINED`, `CANCELLED`, Default: `PENDING`): Ban đầu là `PENDING`, chuyển thành `ACCEPTED` khi gia sư chọn Continue (POST-1), hoặc `DECLINED` khi gia sư từ chối (A1).

### 2. Entity: USER_CREDITS (Model: `User.credit_wallet` & `CreditTransaction`)
- `balance` (Int): Kiểm tra số dư khả dụng (`balance >= 1`), nếu không đủ thì chặn và yêu cầu nạp điểm (E1); nếu hợp lệ thì tự động trừ 1 credit khi chấp nhận lời mời (POST-1).
- `CreditTransaction`: Ghi log giao dịch trừ credit (`amount: -1`, `type: 'USED_INVITATION'`, `related_invitation_id: invitation._id`).

### 3. Entity: PARENT_REQUESTS (Mongoose Model: `ParentRequest`, Collection: `PARENT_REQUESTS`)
- `_id` (ObjectId, PK): Khóa chính bài yêu cầu tìm gia sư.
- `status` (Enum: `OPEN`, `IN_PROGRESS`, `CLOSED`): Kiểm tra điều kiện PRE-1 và ngoại lệ E2: bài yêu cầu phải đang ở trạng thái `OPEN`. Nếu bài đã đóng hoặc đã tìm được gia sư khác thì chặn thao tác và thông báo cho gia sư.

### 4. Entity: CONVERSATIONS (Mongoose Model: `Conversation`, Collection: `CONVERSATIONS`)
- Tự động mở hoặc kích hoạt phiên chat trực tiếp giữa phụ huynh và gia sư sau khi gia sư đồng ý lời mời (`is_active: true`).

---

## TASK #4.3.7: UC18 – CONFIRM CONNECTION (XÁC NHẬN KẾT NỐI THÀNH CÔNG)

### 1. Entity: CONNECTIONS / TUTORING_AGREEMENTS (Mongoose Model: `TutoringAgreement`, Collection: `TUTORING_AGREEMENTS`)
- `_id` (ObjectId, PK): Khóa chính định danh thỏa thuận kết nối dạy học giữa hai bên.
- `conversation_id` (ObjectId, FK -> `Conversation`): Tham chiếu đến phòng chat nơi 2 bên trao đổi.
- `proposer_user_id` (ObjectId, FK -> `User`): Người đề xuất thỏa thuận.
- `accepted_by_user_id` (ObjectId, FK -> `User`): Người xác nhận thỏa thuận.
- `agreed_subject` (String): Môn học được hai bên thống nhất trong chat.
- `agreed_schedule` (String): Lịch học và khung giờ học hai bên đã chốt.
- `agreed_price` (Decimal128): Mức học phí (VND/buổi hoặc tháng) được thống nhất.
- `status` (Enum: `DRAFT`, `PENDING`, `CONFIRMED`, `REJECTED`, `CANCELLED`): Trạng thái thỏa thuận. Khi cả 2 bên đồng ý thì chuyển thành `CONFIRMED` (POST-1).
- `created_at`, `updated_at` (Datetime): Thời điểm tạo và cập nhật trạng thái thỏa thuận.

### 2. Entity: CONVERSATIONS (Mongoose Model: `Conversation`)
- Kiểm tra điều kiện tiên quyết PRE-1: Phải tồn tại một phòng chat đang hoạt động (`is_active: true`) giữa 2 bên.

### 3. Entity: PARENT_REQUESTS (Mongoose Model: `ParentRequest`)
- Tự động cập nhật thành `CLOSED` hoặc `IN_PROGRESS` sau khi thỏa thuận chuyển sang `CONFIRMED` để bài đăng không còn nhận thêm ứng tuyển mới.

---

## TASK #4.8.1: UC35 – VIEW NOTIFICATIONS (XEM THÔNG BÁO HỆ THỐNG)

### 1. Entity: USERS (Mongoose Model: `User`, Collection: `User`)
- `_id` (ObjectId, PK): Định danh người dùng nhận thông báo.
- `role` (Enum: `STUDENT`, `PARENT`, `TUTOR`, `ADMIN`): Phân loại vai trò người dùng để điều hướng thông báo phù hợp.
- `notification_preferences` (Embedded Object): Cấu hình nhận thông báo (`enable_in_app`, `enable_email`, `enable_sms`, `notify_on_sessions`, `notify_on_assignments`, `notify_on_messages`).

### 2. Entity: NOTIFICATIONS (Mongoose Model: `Notification`, Collection: `NOTIFICATIONS`)
- `_id` (ObjectId, PK): Định danh duy nhất từng bản ghi thông báo.
- `recipient_user_id` (ObjectId, FK -> `User`): Tài khoản người nhận thông báo.
- `category` (Enum: `INTEREST`, `INVITATION`, `CONVERSATION`, `SESSION`, `SCHEDULE_CHANGE`, `ASSIGNMENT`, `SYSTEM`): Phân loại danh mục thông báo để hiển thị icon và hỗ trợ lọc.
- `title` (String): Tiêu đề ngắn gọn hiển thị trên màn hình SC10.
- `body` (String): Nội dung chi tiết thông báo.
- `target_type` (Enum: `APPLY_REQUEST`, `TUTOR_INVITATION`, `CONVERSATION`, `CLASS_SESSION`, `ASSIGNMENT`,...): Phân loại thực thể mục tiêu để hỗ trợ Deep Linking khi người dùng click vào thông báo.
- `target_id` (ObjectId): ID đối tượng mục tiêu liên quan.
- `is_read` (Boolean, Default: `false`): Trạng thái đã đọc hay chưa.
- `read_at` (Date, Nullable): Mốc thời gian mở xem thông báo.
- `delivery_logs` (Array subdocument `emb_NOTIFICATION_DELIVERY_LOGS`): Lưu log trạng thái gửi qua IN_APP, EMAIL, SMS.
- `created_at` (Date, Default: `NOW()`): Sắp xếp danh sách thông báo theo thứ tự mới nhất lên đầu.

---

## TASK #5.6.1: UC40 – MODERATE CONTENT & REPORTS (KIỂM DUYỆT NỘI DUNG & BÁO CÁO)

### 1. Entity: CONTENT_REPORTS (Mongoose Model: `ContentReport`, Collection: `CONTENT_REPORTS`)
- `_id` (ObjectId, PK): Định danh duy nhất báo cáo vi phạm cần Admin tiếp nhận xử lý trên SC43.
- `reporter_user_id` (ObjectId, FK -> `User`): ID tài khoản người dùng gửi báo cáo.
- `target_type` (Enum: `POST`, `REQUEST`, `REVIEW`, `MESSAGE`, `USER`, `CLASSROOM`): Phân loại đối tượng bị tố cáo vi phạm.
- `target_id` (ObjectId): ID của đối tượng bị báo cáo để Admin mở xem ngữ cảnh chi tiết và thực hiện xử lý.
- `reason` (String): Lý do vi phạm (spam, phản cảm, giao dịch ngoài sàn, lừa đảo,...).
- `severity` (Enum: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`): Mức độ nghiêm trọng để sắp xếp hàng đợi ưu tiên xử lý.
- `status` (Enum: `PENDING`, `INVESTIGATING`, `RESOLVED`, `DISMISSED`): Quản lý tiến trình xử lý báo cáo.
- `action_taken` (Enum: `NONE`, `WARNING_SENT`, `CONTENT_HIDDEN`, `CONTENT_REMOVED`, `USER_BANNED`): Biện pháp chế tài Admin áp dụng.
- `admin_note` (String): Nhận xét và lý do của Admin khi xử lý (bắt buộc theo **BR-20**).
- `resolved_by_admin_id` (ObjectId, FK -> `User`): ID tài khoản Admin thực hiện duyệt.
- `resolved_at` (Date): Mốc thời gian hoàn tất xử lý báo cáo.

### 2. Entity: ADMIN_AUDIT_LOGS (Mongoose Model: `AdminAuditLog`, Collection: `ADMIN_AUDIT_LOGS`)
- `_id` (ObjectId, PK): Khóa chính bản ghi kiểm toán nhật ký Admin.
- `admin_user_id` (ObjectId, FK -> `User`): ID Admin thực hiện thao tác (BR-20).
- `target_user_id` (ObjectId, FK -> `User`): ID người dùng bị xử phạt.
- `action` (Enum: `MODERATE_CONTENT`, `WARN_USER`, `LOCK_USER`): Phân loại hành động kiểm duyệt.
- `reason` (String): Lý do Admin thực hiện hành động.
- `details_json` (Mixed / JSON): Bản chụp (snapshot) nội dung vi phạm trước khi bị ẩn/xóa để đối soát.
- `ip_address` (String): Địa chỉ IP của Admin khi thao tác.

---

## TASK #5.6.2: UC42 – VIEW SYSTEM STATISTICS (DASHBOARD THỐNG KÊ HỆ THỐNG)

Truy vấn tổng hợp (MongoDB Aggregation Pipeline) trên các collection sẵn có:

1. **`User` & `TUTOR_PROFILES`:**
   - `role`: Thống kê số lượng Student, Parent, Tutor.
   - `TutorProfile.is_complete`, `availability_status`: Thống kê tỷ lệ hồ sơ gia sư hoàn thiện và sẵn sàng nhận lớp.
   - `created_at`: Thống kê số lượng người dùng mới đăng ký theo ngày/tuần/tháng.
2. **`PARENT_REQUESTS`:**
   - `status`: Thống kê tỷ lệ bài đăng (`OPEN`, `IN_PROGRESS`, `CLOSED`).
   - `subject_name`, `grade_level`: Thống kê xu hướng nhu cầu tìm kiếm theo môn học và khối lớp.
3. **`TUTORING_AGREEMENTS`:**
   - `status`: Đếm số thỏa thuận kết nối thành công (`CONFIRMED`) để tính toán tỷ lệ ghép đôi thành công (Match Conversion Rate).
4. **`PAYMENT_ORDERS`:**
   - `amount`, `status: 'SUCCESS'`: Tính tổng doanh thu hệ thống (GMV) theo mốc thời gian.
   - `item_type`: Phân loại nguồn doanh thu từ nâng cấp tài khoản Pro (`PLAN_UPGRADE`) và gói nạp credit (`CREDIT_PACK`).
5. **`CLASSROOMS`:**
   - `status: 'ACTIVE'`: Thống kê số lượng lớp học đang hoạt động trên nền tảng.
6. **`User.subscription.ai_quota_used`:**
   - Thống kê mức độ tiêu thụ hạn mức AI hỗ trợ soạn bài và chấm bài trên toàn hệ thống.
