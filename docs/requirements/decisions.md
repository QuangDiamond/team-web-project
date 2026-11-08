# Quyết định triển khai (những điểm SRS không quy định)

Ghi lại các quyết định khi SRS không nói rõ, để cả nhóm thống nhất. Nguồn yêu cầu chính vẫn là SRS;
nếu SRS được cập nhật khác với file này thì làm theo SRS và sửa lại file này.

| # | UC | Vấn đề | Quyết định | Lý do |
|---|---|---|---|---|
| D1 | UC39 | Gói (plan) có được để 0 credit/tháng không? | **Không.** `monthly_credits` của mọi gói (kể cả Free) phải ≥ 1, giống credit pack (E1 "zero credits"). | Người dùng xác nhận 05/11/2026. |
| D2 | UC02 | Đăng nhập xong chuyển về đâu? | Về **dashboard theo role** (`/dashboard`), đúng UC02 "redirected to the dashboard of their role". | Theo SRS UC02. |
| D3 | UC39 | Có đổi được role của credit pack sau khi tạo không? | **Không.** Chỉ sửa tên, số credit, giá. Muốn đổi role: tắt gói cũ rồi tạo gói mới. | Tránh thay đổi âm thầm gói user đã mua; luồng UC39 chỉ nói sửa "credits, price". |
| D4 | UC17 | Gói credit cũ có `target_role = null` | Hiển thị cho **cả Tutor và Parent**. Tạo mới thì bắt buộc chọn role. | Dữ liệu seed đã có; `null` nghĩa là dùng chung. |
| D5 | UC17 | Chưa nối PSP thật thì test thanh toán thế nào? | Có **trang thanh toán giả** chỉ chạy khi `PSP_BASE_URL` rỗng và không phải production; xử lý kết quả giống hệt webhook. Mọi chỗ cần gọi PSP đánh dấu `TODO(PSP)`. | Để test được UC17/UC18 khi PSP chưa sẵn sàng (xem `docs/TODO.md`). |
| D6 | UC39 | Màn SC41 không có trong Figma | Thiết kế theo phong cách các màn Admin trong Figma (card, bảng, sidebar). | SRS để trống mock-up SC41. |
| D7 | UC17 | Nâng cấp Pro thì credit tháng đầu cấp khi nào? | Cấp **ngay khi thanh toán thành công**: cộng `monthly_credits` của gói Pro vào ví, ghi `CreditTransaction` loại `MONTHLY_GRANT`. Các tháng sau do job cấp credit hàng tháng (chưa làm, xem TODO). | User trả tiền thì phải nhận quyền lợi ngay. |
| D8 | UC17 | Đang Pro mà mua Pro tiếp? | **Cộng dồn thời hạn**: `expires_at` mới = `expires_at` hiện tại (nếu còn hạn) + số tháng mua. Không cho mua gói Free. | Tránh mất thời hạn đã trả. |
| D9 | UC17 | Giới hạn số lượng khi mua | Pro: 1–12 tháng. Credit pack: số lượng 1–10. Số tiền do server tính từ giá hiện tại, không nhận từ client. | Chống sửa giá từ client; số liệu hợp lý cho đồ án. |
| D10 | UC17 | Danh mục gói cho user (plans + packs) | Trả về 1 object `{ plans, packs }` theo role của user, không phân trang (danh mục nhỏ, không phải danh sách dữ liệu). Chỉ hiện gói/pack đang bật (`is_active`). | Quy tắc phân trang áp dụng cho danh sách dữ liệu, không cho danh mục cấu hình. |
| D12 | UC17 | Trang thanh toán giả có cần đăng nhập không? | **Có**: chỉ chủ đơn (đã đăng nhập) mới mở/hoàn tất được trang giả. | Tránh người khác biết mã đơn là hoàn tất được, dù chỉ ở môi trường dev. |
| D13 | UC18 | Đường dẫn biên lai | Trang frontend `/receipts/:orderCode` (khớp `receipt.receipt_url` backend đã lưu). | Đã thống nhất với backend UC17. |
| D14 | UC18 | "Lịch sử" gồm những gì, xuất file thế nào? | 2 danh sách: **biến động credit** (lọc theo loại + khoảng ngày) và **lịch sử thanh toán** (mọi trạng thái, lọc theo trạng thái + khoảng ngày). Xuất **CSV** cho cả 2 theo bộ lọc đang chọn. Biên lai chỉ có cho đơn SUCCESS. | SRS bước 2–4 + A1; CSV theo phạm vi đã chốt. |
| D15 | UC17 | Nút "Hủy thanh toán" cho đơn đang chờ | **Không làm** ở màn Payment Result; đơn chờ tự hết hạn sau 15 phút. API cancel vẫn giữ để dùng khi nối PSP. | SRS SC21 không có nút này. |
| D16 | UC18 | Định dạng ngày & giới hạn khi xuất CSV | Ngày trong CSV theo **giờ Việt Nam, dạng `dd/MM/yyyy HH:mm`**; bộ lọc ngày tính theo ngày giờ VN (UTC+7). Mỗi lần xuất tối đa **5000 dòng** mới nhất. | Người dùng mở bằng Excel ở VN; 5000 dòng đủ cho đồ án. |
| D17 | UC18 | Nội dung CSV | Cột loại / trạng thái / phương thức / tên gói dùng **nhãn dễ đọc tiếng Anh giống giao diện** (vd "Used for application", "Paid", "VietQR", "Pro plan"); tên file theo ngày giờ VN. Màn hình ghi "Expires on" (chưa có tự gia hạn). | Người xem file là user, không phải dev. |
| D18 | UC37 | Suspended khác Banned thế nào? | Cả hai đều **chặn đăng nhập và chặn mọi request** (403). Suspended = khóa tạm (Admin mở lại được bất cứ lúc nào), Banned = khóa vĩnh viễn do vi phạm (vẫn mở lại được bằng thao tác Reactivate). Không có thời hạn tự mở. | SRS không định nghĩa thời hạn; schema không có trường thời hạn. |
| D19 | UC37 | Middleware lấy role/trạng thái từ đâu? | `authentication` đọc user từ DB mỗi request: user không tồn tại → 401, không ACTIVE → 403; `req.user.role` lấy từ DB (đổi role/khóa có hiệu lực ngay, thay cho JWT). | Đáp ứng "revoke sessions" của UC37 mà không cần refresh token. |
| D20 | UC37 | A1 tạo Admin với mật khẩu tạm | Admin nhập họ tên + email + lý do; hệ thống sinh mật khẩu tạm ngẫu nhiên, **hiển thị 1 lần** trên màn hình và gửi email cho admin mới. Ghi audit `UPDATE_SETTINGS`. Chưa bắt đổi mật khẩu ở lần đăng nhập đầu (cần UC04, ghi TODO). | BR-16 không có action riêng cho tạo admin. |
| D21 | UC37 | Admin tự khóa mình / khóa admin khác | Không được đổi trạng thái **tài khoản của chính mình** (E1, 403). Khóa admin khác thì được. | Theo E1; SRS không cấm khóa admin khác. |
| D22 | UC17/UC39 | Credit của gói Free | Gói **Free của cả Tutor và Parent = 20 credit/tháng** (thay cho 5 / 3), khớp với số dư mặc định 20 của ví khi tạo user. Cập nhật dữ liệu gói (qua API Admin, có audit) và file seed `PLANS.json`; **không đổi schema**. | Người dùng quyết định 05/11/2026 (khác BR trong SRS UC17 "Tutor Free 5 credits/month" — cần cập nhật SRS). |
| D23 | Chung | Thay đổi schema DB | **Không đổi schema** trong đợt này; thiếu sót do schema được ghi vào `docs/TODO.md`. | Người dùng quyết định 05/11/2026. |
| D24 | UC37 | Khóa Admin ACTIVE cuối cùng | **Chặn**: không cho Suspend/Ban nếu đó là Admin ACTIVE cuối cùng (422). | Tránh hệ thống không còn ai quản trị. |
| D25 | UC37 | Bắt Admin mới đổi mật khẩu tạm ở lần đăng nhập đầu | **Chưa làm**: cần cờ trong schema + UC04 (D23 không đổi schema). Ghi TODO. | Theo D23. |
| D26 | UC37 | Middleware đọc DB mỗi request | Chấp nhận (1 query nhẹ, chỉ lấy vài field); chưa cache. | Đơn giản, đủ cho quy mô đồ án. |
| D11 | UC17 | Module thanh toán cũ (`/payment/v1/get-payment-url`, demo VNPay) | Thay bằng luồng UC17 trong cùng file `payment.routes.js` / `payment.controller.js` (không xóa file). | Giữ đúng tên module, tránh xóa file. |
