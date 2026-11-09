# TÀI LIỆU TỔNG HỢP ĐẦU VIỆC & KỊCH BẢN CHẠY TÍNH NĂNG (CHIẾN)
**Dự án:** Nền tảng kết nối gia sư và phụ huynh TuConnector  
**Thành viên phụ trách (PIC):** Nguyễn Tiến Chiến (`NChienK18` / `Chiennthe187054@fpt.edu.vn`)  
**Nhánh Git:** `chiennt` (PR #3 merge vào `develop`)  
**Ngày cập nhật:** 09/11/2026  

---

## I. TRẠNG THÁI HỆ THỐNG HIỆN TẠI (SYSTEM RUNTIME STATUS)

Dự án hiện đang chạy ổn định đồng thời cả Backend và Frontend, kết nối cơ sở dữ liệu và vượt qua toàn bộ các bài kiểm thử:

- **Backend Server:** Đang chạy tại `http://localhost:9999` (Node.js ESM + Express 5, kết nối MongoDB thành công).
- **Frontend App:** Đang chạy tại `http://localhost:5173/` (React 19 + Vite 7).
- **Kiểm thử Backend:** `120/120` tests PASS (`pass 120, fail 0`).
- **Kiểm thử Frontend:** `14/14` tests PASS (`pass 14, fail 0`).
- **Production Build:** `npm run build --prefix frontend` thành công (0 lỗi, 2303 modules transformed).

---

## II. DANH SÁCH TÀI KHOẢN MẪU ĐỂ CHẠY THỬ (DEMO ACCOUNTS)

Tất cả tài khoản trong cơ sở dữ liệu dùng chung mật khẩu mặc định: **`Tuconnector@123`** (đã được kích hoạt `account_status: ACTIVE` và `email_verify_status: true`).

| Vai trò (Role) | Email đăng nhập | Mật khẩu | Họ và tên | Tính năng kiểm thử chính |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@tuconnector.vn` | `Tuconnector@123` | Quản trị viên | - **SC40 Admin Dashboard** (UC42 Thống kê số liệu)<br>- **SC43 Kiểm duyệt nội dung** (UC40 Moderation) |
| **PARENT** | `ha.parent@gmail.com`<br>`tuan.parent@gmail.com` | `Tuconnector@123` | Phạm Thu Hà<br>Đỗ Anh Tuấn | - **SC17 Duyệt đơn ứng tuyển** (UC15)<br>- **SC22 Chốt thỏa thuận dạy học** (UC16 / UC18)<br>- **SC24 Đánh giá gia sư** (UC36)<br>- **Widget chat nổi & Popover thông báo** |
| **TUTOR** | `minh.tutor@gmail.com`<br>`lan.tutor@gmail.com`<br>`huy.tutor@gmail.com` | `Tuconnector@123` | Nguyễn Văn Minh<br>Trần Thị Lan<br>Lê Quang Huy | - **SC29 Hộp thư lời mời dạy** (UC17)<br>- **SC22 Xác nhận thỏa thuận & Tạo lớp** (UC18)<br>- **Widget chat nổi & Phản hồi tin nhắn** |
| **STUDENT** | `an.student@gmail.com`<br>`binh.student@gmail.com` | `Tuconnector@123` | Phạm Minh An<br>Đỗ Gia Bình | - Xem lớp học, làm bài tập (Student Dashboard) |

---

## III. KỊCH BẢN CHẠY & KIỂM THỬ TỪNG TÍNH NĂNG (DEMO SCENARIOS)

### Kịch bản 1: Widget Chat Nổi Kéo Thả Phong Cách Messenger (Floating Chat Widget)
*Mục đích: Cho phép người dùng nhắn tin nhanh trên bất kỳ trang nào (Trang chủ, Dashboard, Tìm gia sư) mà không bị gián đoạn công việc.*

1. **Truy cập**: Mở trình duyệt tại [http://localhost:5173/](http://localhost:5173/) (đăng nhập tài khoản `ha.parent@gmail.com` / `Tuconnector@123`).
2. **Kiểm tra hiển thị bong bóng chat nổi**:
   - Ở góc dưới bên phải màn hình, xuất hiện một icon bong bóng chat nổi màu xanh gradient với tooltip *"Mở tin nhắn (Kéo thả để di chuyển)"*.
   - Nếu có tin nhắn mới chưa đọc, bong bóng hiển thị chấm đỏ kèm số lượng tin nhắn chưa đọc và hiệu ứng nảy nhẹ.
3. **Thao tác kéo thả vị trí (Draggable)**:
   - Nhấn giữ chuột trái vào icon bong bóng chat và kéo di chuyển đến các vị trí khác trên màn hình (lên góc trên, sang cạnh trái,...).
   - Thả chuột: Widget giữ nguyên vị trí mới được thả, không bị bật ngược về vị trí cũ.
4. **Mở cửa sổ chat popup**:
   - Nhấp vào icon bong bóng chat. Cửa sổ chat dạng popup nhỏ gọn (~380px x 520px) sẽ mở ra ngay cạnh bong bóng.
   - Hiển thị danh sách các cuộc hội thoại gần đây kèm avatar, tên người liên hệ và nội dung tin nhắn mới nhất.
5. **Gửi tin nhắn trong popup**:
   - Nhấp vào một cuộc hội thoại (ví dụ: Gia sư `Nguyễn Văn Minh`).
   - Khung hội thoại mở ra với lịch sử chat.
   - Nhập tin nhắn: *"Chào gia sư, mình muốn hỏi thêm về lịch dạy kèm tuần tới."* và nhấn Enter hoặc nút gửi.
   - Tin nhắn hiển thị ngay lập tức trong khung chat với thời gian gửi theo giờ Việt Nam.
6. **Thu nhỏ / Đóng popup**:
   - Bấm nút icon thu nhỏ `_` hoặc nút đóng `X` ở góc trên popup để thu gọn lại thành bong bóng chat nổi.

---

### Kịch bản 2: Chuông Thông Báo & Popover Xem Nhanh Trên Header (Navbar Notifications)
*Mục đích: Giúp người dùng nắm bắt ngay 5 thông báo mới nhất ngay tại Header mà không cần phải chuyển trang sang Dashboard.*

1. **Truy cập**: Ở góc trên bên phải thanh Navbar (khi đã đăng nhập), nhấp vào biểu tượng **Chuông thông báo**.
2. **Kiểm tra Popover Dropdown**:
   - Menu popover trượt xuống mượt mà ngay bên dưới chuông thông báo.
   - Header popover hiển thị tiêu đề "Thông báo" và nhãn số lượng thông báo mới (ví dụ: `2 mới`).
   - Danh sách hiển thị tối đa 5 thông báo gần nhất kèm icon phân loại (tin nhắn, lời mời, thỏa thuận, hệ thống).
3. **Thao tác "Đã đọc hết" tại chỗ**:
   - Nhấp nút **"Đã đọc hết"** (`CheckCheck` icon) trên thanh header popover.
   - Toàn bộ chấm đỏ chưa đọc biến mất, badge số lượng trên chuông thông báo trở về 0 ngay lập tức mà không cần F5 trang.
4. **Chuyển hướng trang đầy đủ**:
   - Ở chân popover, bấm vào liên kết **"Xem tất cả thông báo trong Dashboard →"**. Hệ thống chuyển hướng mượt mà sang trang `/notifications`.

---

### Kịch bản 3: Hệ Thống Tin Nhắn & Trò Chuyện Dashboard (UC32 / SC20 Chat Page)
*Mục đích: Màn hình nhắn tin chuyên sâu, quản lý nhiều cuộc hội thoại, dọn dẹp các icon rối mắt và lỗi tràn chữ.*

1. **Điều hướng**: Truy cập đường dẫn `/parent/messages` (hoặc `/tutor/messages`).
2. **Kiểm tra ô tìm kiếm người liên hệ**:
   - Ở thanh tìm kiếm trên Sidebar hội thoại, nhập tên hoặc số điện thoại.
   - **Xác nhận**: Chữ nhập vào hiển thị cách đều (padding-left 36px), hoàn toàn không còn bị đè lên icon kính lúp.
3. **Kiểm tra giao diện hội thoại**:
   - Các icon hình ngôi sao AI ("sparkles") thừa thãi đã được gỡ bỏ, mang lại giao diện tin nhắn tối giản, chuyên nghiệp và rõ ràng.
   - Loại bỏ các text kỹ thuật như mã `(UC...)` hay `(SC...)` trong tiêu đề thông tin thỏa thuận.
4. **Nhắn tin phản hồi**:
   - Gõ tin nhắn và gửi, tin nhắn được căn chỉnh dạng bong bóng bên phải (màu cam/xanh cho người gửi) và bên trái (màu xám nhạt cho người nhận).

---

### Kịch bản 4: Phụ Huynh Duyệt Đơn Ứng Tuyển Của Gia Sư (UC15 / SC17 Applications Review)
*Mục đích: Phụ huynh kiểm tra năng lực các gia sư đã nộp đơn và quyết định kết nối tiếp hoặc từ chối.*

1. **Đăng nhập**: Sử dụng tài khoản Phụ huynh `ha.parent@gmail.com` / `Tuconnector@123`.
2. **Thao tác**:
   - Vào mục **"Yêu cầu tìm gia sư"** (`/parent/requests`).
   - Chọn bài đăng tìm gia sư đang có trạng thái `OPEN` có đơn ứng tuyển.
   - Bấm vào nút **"Xem danh sách đơn ứng tuyển"** (SC17).
3. **Kiểm tra thông tin ứng viên**:
   - Lưới thẻ gia sư hiển thị đầy đủ: Họ tên, ảnh đại diện, trường đại học, chuyên ngành, mức học phí đề xuất, lời giới thiệu từ gia sư.
   - Bấm **"Xem chi tiết hồ sơ"**: Modal mở ra hiển thị kinh nghiệm giảng dạy, chứng chỉ và bằng cấp.
4. **Thực hiện hành động**:
   - **Trường hợp A (Tiếp tục trao đổi - Continue)**: Bấm nút **"Tiếp tục trao đổi"**. Hệ thống cập nhật trạng thái đơn thành `CONTINUED`, mở cuộc hội thoại chat 1-1 với gia sư, không trừ thêm credit của phụ huynh.
   - **Trường hợp B (Bỏ qua - Skip)**: Bấm nút **"Bỏ qua"**. Trạng thái chuyển sang `SKIPPED`, gia sư nhận được thông báo kết quả.

---

### Kịch bản 5: Gia Sư Phản Hồi Lời Mời Dạy Học (UC17 / SC29 Invitations Inbox)
*Mục đích: Gia sư xem xét các lời mời dạy kèm trực tiếp từ phụ huynh và phản hồi chấp nhận hoặc từ chối.*

1. **Đăng nhập**: Sử dụng tài khoản Gia sư `minh.tutor@gmail.com` / `Tuconnector@123`.
2. **Điều hướng**: Vào `Tutor Dashboard` -> chọn menu **"Lời mời đã nhận"** (`/tutor/invitations/received`).
3. **Kiểm tra bảo mật dữ liệu**:
   - Thông tin cá nhân nhạy cảm của phụ huynh (số điện thoại, email) được ẩn trước khi hai bên đồng ý kết nối.
   - Hiển thị thông tin lớp: Môn học, khối lớp, địa điểm/hình thức học, mức học phí đề xuất và lời nhắn từ phụ huynh.
4. **Thực hiện phản hồi**:
   - **Trường hợp A (Chấp nhận - Accept)**: Bấm nút **"Chấp nhận"**. Lời mời chuyển trạng thái `ACCEPTED`, hệ thống tự động mở phòng chat 1-1 giữa 2 bên, gửi thông báo cho phụ huynh.
   - **Trường hợp B (Từ chối - Decline)**: Bấm nút **"Từ chối"**. Lời mời chuyển `DECLINED` trong yên lặng.

---

### Kịch bản 6: Chốt Thỏa Thuận Học Tập & Đánh Giá Gia Sư (UC16, UC18 & SC24 My Connections)
*Mục đích: Thiết lập cam kết học tập chính thức giữa phụ huynh và gia sư, liên kết sang tạo lớp học và đánh giá chất lượng gia sư.*

1. **Phụ huynh tạo đề xuất thỏa thuận**:
   - Đăng nhập `ha.parent@gmail.com` -> truy cập trang **"Hợp đồng & Kết nối"** (`/connections`).
   - Tại form đề xuất thỏa thuận, chọn yêu cầu học sinh, nhập mức học phí (ví dụ: `250.000 VNĐ/buổi`), lịch học (ví dụ: `Thứ 2, Thứ 4 (19h30 - 21h00)`).
   - Bấm **"Gửi đề xuất thỏa thuận"**. Thỏa thuận được tạo ở trạng thái `PENDING`.
   - *Quy tắc kiểm tra:* Người gửi đề xuất chỉ thấy nút "Hủy đề xuất", không thể tự bấm "Xác nhận".
2. **Gia sư xác nhận thỏa thuận**:
   - Đăng nhập `minh.tutor@gmail.com` -> truy cập `/connections`.
   - Thấy thỏa thuận đang `PENDING`. Bấm **"Xác nhận thỏa thuận"** (Confirm).
   - Trạng thái chuyển sang `CONFIRMED`.
   - **Liên kết Tạo lớp học (Classroom)**: Trên thẻ thỏa thuận đã xác nhận xuất hiện nút **"Tạo lớp học"** kèm icon `GraduationCap`. Khi bấm vào, hệ thống tự động chuyển sang trang tạo lớp học kèm thông tin thỏa thuận được điền sẵn.
3. **Phụ huynh đánh giá gia sư (UC36 / BR-07)**:
   - Đăng nhập lại `ha.parent@gmail.com` -> vào `/connections`.
   - Tại thỏa thuận đã xác nhận, bấm nút **"Đánh giá gia sư"**.
   - Modal mở ra: Chọn số sao (từ 1 đến 5 sao), nhập nhận xét: *"Gia sư dạy rất nhiệt tình và đúng giờ"*. Bấm Gửi đánh giá. Điểm đánh giá trung bình của gia sư được cập nhật ngay lập tức.

---

### Kịch bản 7: Cài Đặt Tùy Chọn Nhận Thông Báo (UC33 / SC10 Preferences)
*Mục đích: Người dùng tự cấu hình kênh và loại thông báo theo nhu cầu cá nhân.*

1. **Điều hướng**: Truy cập `/notifications`.
2. **Mở hộp thoại cấu hình**: Bấm nút **"Cài đặt thông báo"** (Preferences).
3. **Thao tác**:
   - Hộp thoại hiển thị các tùy chọn bật/tắt: *Thông báo trong ứng dụng*, *Thông báo qua Email*, *Thông báo SMS*, *Nhắc nhở lịch học*.
   - Đổi một số checkbox và bấm **"Lưu cài đặt"**.
   - F5 tải lại trang: Kiểm tra các lựa chọn vừa cập nhật vẫn được giữ nguyên (lưu bền vững vào MongoDB).

---

### Kịch bản 8: Admin Kiểm Duyệt Báo Cáo Vi Phạm (UC38, UC40 / SC43 Moderation)
*Mục đích: Admin rà soát các báo cáo vi phạm, nội dung không phù hợp và áp dụng biện pháp chế tài.*

1. **Đăng nhập**: Sử dụng tài khoản `admin@tuconnector.vn` / `Tuconnector@123`.
2. **Điều hướng**: Vào `http://localhost:5173/admin/moderation`.
3. **Kiểm tra danh sách báo cáo**:
   - Hàng đợi phân loại mức độ nghiêm trọng: `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`.
   - Khung xem trước nội dung bị tố cáo (Target Preview: bài đăng tìm gia sư, bình luận, hoặc hồ sơ gia sư).
4. **Xử lý vi phạm (Resolution Dialog)**:
   - Bấm nút **"Xử lý báo cáo"** trên một báo cáo `PENDING`.
   - Chọn biện pháp xử lý: *Bỏ qua báo cáo (Dismiss)*, *Cảnh cáo người dùng (Send Warning)*, *Ẩn nội dung (Hide Content)*, hoặc *Khóa tài khoản (Ban User)*.
   - **Bắt buộc**: Nhập "Ghi chú xử lý của Quản trị viên" (tối thiểu 5 ký tự theo quy định BR-16).
   - Bấm **"Xác nhận xử lý"**: Trạng thái chuyển sang `RESOLVED`, nhật ký kiểm duyệt được lưu trữ vào `ADMIN_AUDIT_LOGS` và hệ thống tự động gửi thông báo kết quả.

---

### Kịch bản 9: Admin Xem Phân Tích Thống Kê Hệ Thống (UC42 / SC40 Admin Dashboard)
*Mục đích: Cung cấp bức tranh toàn cảnh về hoạt động, tài chính và quy mô người dùng cho Ban quản trị.*

1. **Đăng nhập**: Sử dụng tài khoản `admin@tuconnector.vn` / `Tuconnector@123`.
2. **Điều hướng**: Vào `http://localhost:5173/admin/dashboard`.
3. **Kiểm tra số liệu thời gian thực (KPI Cards)**:
   - Tổng số người dùng phân loại chi tiết (Admin, Phụ huynh, Gia sư, Học sinh).
   - Doanh thu thực từ các đơn nạp Credits và mua gói cước (tính toán chuẩn xác từ bảng `PaymentOrder`, không bịa đặt số liệu ảo).
   - Tỷ lệ ghép đôi gia sư thành công và số lượng yêu cầu đang mở.
4. **Chuyển đổi bộ lọc chu kỳ**:
   - Bấm chuyển đổi giữa các nút thời gian: **7 ngày**, **30 ngày**, **90 ngày**, **1 năm**.
   - Biểu đồ tăng trưởng doanh thu và người dùng tự động vẽ lại tương ứng với dữ liệu trong khoảng thời gian đã chọn.
5. **Xuất báo cáo**: Bấm nút **"Xuất báo cáo số liệu"** để xem và tải tóm tắt thống kê.

---

## IV. BẢNG TỔNG HỢP CẤU TRÚC FILE & FOLDER CHI TIẾT

```
TuConnector/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat/
│   │   │   │   ├── FloatingChatWidget.jsx         # [CHIẾN] Widget tin nhắn nổi kéo thả kiểu Messenger
│   │   │   │   ├── ChatSidebar.jsx                # [CHIẾN] Danh sách hội thoại + ô tìm kiếm
│   │   │   │   └── MessageThread.jsx              # [CHIẾN] Khung chat chi tiết, bong bóng tin nhắn
│   │   │   ├── notifications/
│   │   │   │   ├── NotificationCard.jsx           # [CHIẾN] Thẻ thông báo độc lập
│   │   │   │   └── PreferencesDialog.jsx          # [CHIẾN] Hộp thoại cấu hình kênh nhận thông báo
│   │   │   ├── applicationReview/
│   │   │   │   ├── ApplicationsSection.jsx        # [CHIẾN] Khối danh sách đơn ứng tuyển của gia sư
│   │   │   │   ├── ReceivedApplicationCard.jsx    # [CHIẾN] Thẻ tóm tắt thông tin gia sư ứng tuyển
│   │   │   │   └── ApplicationDetailModal.jsx     # [CHIẾN] Modal xem chi tiết hồ sơ gia sư
│   │   │   ├── moderation/
│   │   │   │   ├── ReportCard.jsx                 # [CHIẾN] Thẻ thông tin báo cáo vi phạm
│   │   │   │   └── ResolutionDialog.jsx           # [CHIẾN] Modal xử lý vi phạm + ghi chú admin
│   │   │   └── adminStats/
│   │   │       ├── StatsOverview.jsx              # [CHIẾN] Thẻ KPI tổng quan hệ thống
│   │   │       ├── StatsCharts.jsx                # [CHIẾN] Biểu đồ xu hướng đa chuỗi (7d/30d/90d/1y)
│   │   │       ├── StatsExportDialog.jsx          # [CHIẾN] Hộp thoại xuất báo cáo
│   │   │       └── useAdminStats.js               # [CHIẾN] Hook tính toán số liệu thống kê
│   │   ├── layouts/
│   │   │   └── Layout.jsx                         # [CHIẾN] Header navbar, popover thông báo, footer
│   │   ├── pages/
│   │   │   ├── Home.jsx                           # [CHIẾN] Trang chủ công khai TuConnector
│   │   │   ├── chat/ChatPage.jsx                  # [CHIẾN] Màn hình chat toàn màn hình
│   │   │   ├── notifications/Notifications.jsx    # [CHIẾN] Trang danh sách thông báo
│   │   │   ├── connections/MyConnections.jsx      # [CHIẾN] Quản lý hợp đồng & đánh giá gia sư
│   │   │   ├── tutor/ReceivedInvitations.jsx      # [CHIẾN] Hộp thư lời mời dạy của gia sư
│   │   │   ├── admin/Moderation.jsx               # [CHIẾN] Màn hình kiểm duyệt báo cáo Admin
│   │   │   └── admin/AdminDashboard.jsx           # [CHIẾN] Bảng điều khiển phân tích Admin
│   │   ├── services/
│   │   │   ├── chatService.js                     # [CHIẾN] API client cho tin nhắn & hội thoại
│   │   │   ├── notificationService.js             # [CHIẾN] API client cho thông báo
│   │   │   └── agreementService.js                # [CHIẾN] API client cho thỏa thuận dạy học
│   │   ├── styles/
│   │   │   ├── FloatingChatWidget.css             # [CHIẾN] CSS widget chat nổi kéo thả
│   │   │   ├── chat.css & Messages.css            # [CHIẾN] CSS khung chat & tin nhắn
│   │   │   ├── Notifications.css                  # [CHIẾN] CSS trang và danh mục thông báo
│   │   │   ├── MyConnections.css                  # [CHIẾN] CSS hợp đồng & modal đánh giá 5 sao
│   │   │   ├── applicationReview.css              # [CHIẾN] CSS lưới thẻ duyệt gia sư ứng tuyển
│   │   │   ├── invitations.css                    # [CHIẾN] CSS danh sách lời mời dạy
│   │   │   ├── Moderation.css                     # [CHIẾN] CSS kiểm duyệt vi phạm
│   │   │   ├── AdminDashboard.css                 # [CHIẾN] CSS bảng điều khiển thống kê Admin
│   │   │   └── Home.css                           # [CHIẾN] CSS trang chủ responsive
│   │   └── tests/
│   │       ├── navbar.test.js                     # [CHIẾN] Kiểm thử Navbar & Popover
│   │       └── adminScreens.test.js               # [CHIẾN] Kiểm thử giao diện Admin Dashboard
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── chat.controller.js                 # [CHIẾN] Controller xử lý chat & tin nhắn
│   │   │   ├── notification.controller.js         # [CHIẾN] Controller xử lý thông báo & unread
│   │   │   ├── agreement.controller.js            # [CHIẾN] Controller chốt thỏa thuận & đánh giá
│   │   │   ├── moderation.controller.js           # [CHIẾN] Controller kiểm duyệt báo cáo
│   │   │   └── stats.controller.js                # [CHIẾN] Controller thống kê số liệu Admin
│   │   ├── services/
│   │   │   ├── chat.service.js                    # [CHIẾN] Nghiệp vụ chat & phân quyền hội thoại
│   │   │   ├── notification.service.js            # [CHIẾN] Nghiệp vụ push thông báo & đếm chưa đọc
│   │   │   ├── agreement.service.js               # [CHIẾN] Nghiệp vụ hợp đồng & cập nhật điểm gia sư
│   │   │   ├── moderation.service.js              # [CHIẾN] Nghiệp vụ khóa tài khoản & nhật ký kiểm duyệt
│   │   │   └── stats.service.js                   # [CHIẾN] Nghiệp vụ tổng hợp số liệu MongoDB
│   │   ├── models/
│   │   │   ├── Message.js & Conversation.js       # [CHIẾN] Model tin nhắn & hội thoại
│   │   │   ├── Notification.js                    # [CHIẾN] Model thông báo
│   │   │   ├── Agreement.js                       # [CHIẾN] Model thỏa thuận dạy học
│   │   │   └── Rating.js                          # [CHIẾN] Model đánh giá gia sư
│   │   ├── routes/
│   │   │   ├── chat.routes.js                     # [CHIẾN] Định tuyến /chat/v1
│   │   │   ├── notification.routes.js             # [CHIẾN] Định tuyến /notifications/v1
│   │   │   ├── agreement.routes.js                # [CHIẾN] Định tuyến /agreements/v1
│   │   │   ├── moderation.routes.js               # [CHIẾN] Định tuyến /moderation/v1
│   │   │   └── stats.routes.js                    # [CHIẾN] Định tuyến /admin/stats/v1
│   │   └── common/validator/
│   │       └── agreementSchema.js, statsSchema.js # [CHIẾN] Zod schemas xác thực dữ liệu API
│   └── tests/unit/
│       ├── agreementRatingModerationNotification.test.js # [CHIẾN] Unit test thỏa thuận, đánh giá, thông báo
│       └── adminStats.test.js                            # [CHIẾN] Unit test độ chính xác số liệu thống kê
└── docs/
    └── bao_cao_dau_viec.md                        # [CHIẾN] Bản tài liệu lưu trữ chính thức trong source code
```

---

## V. CÁC LỆNH CHẠY & KIỂM THỬ THƯỜNG DÙNG

```bash
# 1. Chạy toàn bộ hệ thống cùng lúc (Frontend + Backend)
npm run dev

# 2. Hoặc chạy riêng từng service:
npm run dev:backend     # Chạy Backend (Port 9999)
npm run dev:frontend    # Chạy Frontend (Port 5173)

# 3. Chạy toàn bộ bài test Backend (120 tests)
npm test --prefix backend

# 4. Chạy toàn bộ bài test Frontend (14 tests)
cd frontend && node --test tests/*.test.js

# 5. Kiểm tra build đóng gói sản phẩm
npm run build --prefix frontend
```

