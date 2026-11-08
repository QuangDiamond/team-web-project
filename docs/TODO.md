# TODO: phần đã cắt giảm / chưa làm

Danh sách các phần cố ý chưa làm hoặc làm giản lược khi triển khai UC17, UC18, UC37, UC39.
Mỗi mục ghi rõ lý do và việc cần làm khi bổ sung.

## Tích hợp PSP (Payment Gateway Service – `C:\otherDisk\dev\PSP`)

PSP client HMAC, tạo / tra cứu / hủy payment và xác thực webhook đã triển khai.

- [ ] PSP source local hiện chưa có route POST /payments/:id/cancel và webhook dispatcher.
      Adapter TuConnector đã triển khai theo contract, cần PSP triển khai / xác nhận bản deploy hỗ trợ.
- [ ] Đăng ký webhook URL công khai HTTPS trỏ đến `/api/payment/v1/psp/webhook` trong PSP.
- [ ] Test thanh toán sandbox từ trình duyệt và webhook qua URL công khai.
- [ ] PSP contract chưa hỗ trợ chọn payment method qua API. Các lựa chọn trong app được lưu tại đơn,
      người dùng chọn phương thức thực tế trên trang VNPay.

## UC17 – Upgrade Plan & Buy Credits

- [ ] Job cấp credit hàng tháng cho gói Pro (D7: hiện chỉ cấp tháng đầu khi thanh toán) và trừ credit tháng
      hết hạn (`EXPIRED_GRANT`), reset `ai_quota_used`. Cần scheduler.
- [ ] Thanh toán thành công: đổi trạng thái đơn và cộng quyền lợi chưa nằm trong transaction (Mongo local
      standalone). Nếu lỗi giữa chừng, đơn `SUCCESS` mà chưa cộng credit (đã log `needs manual handling` khi
      thiếu plan/pack). Bọc `session.withTransaction` khi chạy replica set.
- [ ] `PAYMENT_ORDERS` không có field `expires_at`, `payment_id` (PSP), số credit chốt lúc đặt: hiện hạn đơn
      tính từ `created_at + 15 phút`, payment_id tra lại bằng `GET /payments?order_id=`, credit của pack lấy theo
      giá trị lúc thanh toán thành công. **Người dùng quyết định không đổi schema (05/11/2026)**: giữ nguyên, chỉ
      ghi chú tại đây; bổ sung field khi nhóm cho phép đổi schema.
- [ ] Index unique `order_code` chỉ có khi chạy `init_tuconnector.js` (DB local hiện chưa có index/validator).
- [ ] Bỏ dependency `vnpay` và biến `VNP_*` trong `.env.example` khi đã nối PSP thật (demo cũ đã xóa khỏi code).

- [ ] A1 Auto-renew Pro: nhắc gia hạn trước khi hết kỳ và tự trả về Free khi hết hạn. Chưa làm vì cần
      bộ lập lịch chạy nền (cron / job queue).

## UC18 – View Credits & Transactions

- [ ] A1 Export: chỉ xuất CSV. Xuất Excel/PDF cần thêm thư viện (chưa được duyệt).
- [ ] CSV export tối đa 5000 dòng mới nhất (không phân trang). Nếu cần nhiều hơn: stream theo cursor.
- [ ] Bộ lọc query (`type`, `status`, `from`, `to`) validate bằng `validateQuery` trong controller (shortcut);
      chuyển sang `validator(schema, 'query')` khi làm mục "Planned" trong AGENTS.md.
- [ ] `GET /orders` chuyển đơn PENDING quá hạn sang EXPIRED mỗi lần gọi (updateMany theo user). Khi có scheduler
      nên làm bằng job chạy nền.
- [ ] Biên lai: chỉ xem dạng trang HTML có thể in, chưa sinh file PDF.

## UC37 – Manage User Accounts

- [ ] "Thu hồi phiên" làm bằng cách `authentication` đọc user từ DB mỗi request (D19): khóa / đổi role có hiệu lực
      ngay. Chưa có danh sách phiên đăng nhập (UserSession) để xem / đăng xuất từng thiết bị; mỗi request thêm 1 query
      `User.findById` (có thể cache ngắn hạn nếu cần).
- [ ] (Có từ trước) Email ở register / login phân biệt hoa thường: `A@x.com` và `a@x.com` thành 2 tài khoản, đăng nhập
      phải gõ đúng hoa thường. Chỉ API tạo Admin (UC37) đã lưu chữ thường + kiểm tra trùng không phân biệt hoa thường.
- [ ] Admin mới đăng nhập bằng mật khẩu tạm chưa bị bắt đổi mật khẩu ở lần đầu (D20, cần UC04 đổi mật khẩu).
- [ ] "Thông báo cho user": chỉ gửi email, chưa có thông báo in-app (UC33).

## UC39 – Manage Plans & Pricing

- [ ] Cập nhật gói + ghi audit log chưa chạy trong transaction (MongoDB local là standalone). Nếu ghi
      log lỗi thì giá trị mới đã lưu mà thiếu log. Khi DB chạy replica set (Atlas) nên bọc bằng
      `session.withTransaction`.
- [ ] Query `page` / `limit` chưa validate bằng Zod (đang chờ `validator(schema, source)`), hiện giá trị
      sai thì dùng mặc định.
- [x] Gói credit seed cũ có `target_role = null`: hiển thị cho cả Tutor và Parent (D4).

## UC39 – Plans & Pricing (frontend)

- [ ] Màn `/admin/plans` lấy 1 trang `limit=100` cho plan và credit pack, chưa có phân trang trên UI
      (đủ dùng vì số gói ít; cần thêm nếu số credit pack vượt 100).
- [ ] Drawer sidebar trên mobile: chưa giữ focus bên trong khi mở (đóng được bằng Esc / nút X / bấm nền).

## UC17 – Upgrade Plan & Buy Credits (frontend)

- [ ] Trang kết quả chỉ hỏi lại trạng thái đơn ~30 giây (10 lần x 3 giây), sau đó user bấm "Refresh status".

## Ví credit & schema (quyết định 05/11/2026: không đổi schema)

- [ ] `CreditWallet.balance` mặc định 20 nằm trong schema: user mới có sẵn 20 credit nhưng **không có
      `CreditTransaction` tương ứng**, nên lịch sử credit (UC18) của user mới trống. Gói Free đã nâng lên 20
      credit/tháng (D22) cho khớp. Khi được đổi schema / có job cấp credit: ghi giao dịch `MONTHLY_GRANT` lúc tạo ví.
