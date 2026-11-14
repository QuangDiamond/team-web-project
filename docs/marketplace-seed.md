> Marketplace demo data is also included in the central seed.

# Dữ liệu mẫu gia sư, bài đăng và kết nối

Chạy trong `backend/`:

```sh
npm run seed:marketplace -- --dry-run
npm run seed:marketplace
```

- Dry run kiểm tra toàn bộ document bằng Mongoose, không kết nối DB.
- Lệnh nạp dùng `MONGODB_URI` theo cấu hình backend. Cần có gói Free đang hoạt động cho cả TUTOR và PARENT; nếu thiếu, khởi tạo gói theo hướng dẫn seed hiện có trước.
- Không chạy trên production. Không xóa collection, không thay schema, không sửa tài khoản hoặc dữ liệu cũ.
- `_id` cố định theo namespace `tuconnector:marketplace-demo:v1`; chỉ thêm document chưa có bằng `$setOnInsert`. Chạy lại giữ nguyên mật khẩu, số dư, nội dung và trạng thái đã thao tác. Không làm mới ngày của request cũ; sau 30 ngày request vẫn hết hạn theo nghiệp vụ.
- Danh mục hiện có được tái sử dụng theo tên; chỉ thêm tên thiếu. Nếu danh mục cần dùng bị tắt, script dừng trước khi ghi, không tự bật lại.
- Lỗi giữa chừng có thể để lại một phần dữ liệu; chạy lại để thêm phần thiếu. Không dùng `seed:drop` để nạp bộ này.

## Tài khoản

| Vai trò | Email | Số lượng |
|---|---|---|
| Gia sư | `demo.tutor01@example.com` đến `demo.tutor16@example.com` | 16 |
| Phụ huynh | `demo.parent01@example.com` đến `demo.parent28@example.com` | 28 |

Mật khẩu chung: `Abc123456!`. Chỉ lưu bcrypt hash với cost 10, giống đăng ký hiện tại. Email dùng miền mẫu, đã xác thực, không gửi email khi seed; thông báo email tắt cho các tài khoản demo.

## Dữ liệu và luồng kiểm tra

- 16 hồ sơ hoàn thiện: 8 gia sư Toán (Lớp 9/12), 8 gia sư Tiếng Anh (IELTS/TOEIC). Danh mục trên hồ sơ khớp bài đăng để dùng luồng gợi ý.
- 32 bài gia sư `PUBLISHED`, mỗi gia sư 2 bài; giá và hình thức học đa dạng.
- Tổng 108 yêu cầu phụ huynh `OPEN`: 12 bài ban đầu của 4 phụ huynh và 96 bài bổ sung của 24 phụ huynh mới (4 bài/người). Ngày tạo trong 3 ngày trước lần nạp đầu để còn hiệu lực.
- 96 bài mới trải trên 12 môn: Toán, Ngữ văn, Tiếng Anh, Vật lý, Hóa học, Sinh học, Tin học, Lập trình, Tiếng Việt, Lịch sử, Địa lý, Tiếng Nhật. Trình độ gồm lớp 1–12, IELTS, TOEIC, JLPT N5/N4/N3, Giao tiếp, Cơ bản/Nâng cao; chỉ thêm danh mục thiếu.
- Yêu cầu mới đa dạng mục tiêu học, học phí 120.000–390.000 đ/buổi, 3 hình thức ONLINE/OFFLINE/HYBRID, 6 khu vực và 8 khung lịch. Giữ trống ứng tuyển/lời mời ở các bài mới để dùng thử gợi ý, ứng tuyển và gửi lời mời. Không trừ thêm credits của tài khoản đã có.
- Mỗi yêu cầu trong 12 bài ban đầu có 6 ứng tuyển: 2 `PENDING`, 2 `CONTINUED`, 2 `SKIPPED`. Tổng 72 đơn; credits ưu tiên từ 1–3.
- Mỗi yêu cầu trong 12 bài ban đầu có 2 lời mời đến 2 gia sư khác, chưa ứng tuyển vào yêu cầu đó. Tổng 24 lời mời: 8 `PENDING`, 8 `ACCEPTED`, 8 `DECLINED`.
- Lời mời theo schema hiện tại gắn với **request + tutor profile**, không gắn trực tiếp với ID bài đăng gia sư. Gia sư được mời có bài đăng cùng môn/trình độ; không thêm trường mới vào schema.
- 32 phòng chat cho 24 đơn được tiếp tục và 8 lời mời được chấp nhận, mỗi phòng 2 tin nhắn mẫu. Đơn bị bỏ qua/lời mời bị từ chối không có phòng chat.
- Mỗi tài khoản được cấp 20 credits; có lịch sử cấp và trừ theo đơn/lời mời, số dư còn dương. Không tạo giao dịch PSP, không gửi email hoặc thông báo ra ngoài.

Mở `/tutors`, danh sách bài đăng, `/tutor/requests`, gợi ý, ứng tuyển, lời mời và tin nhắn bằng các tài khoản trên. Phụ huynh có thể mở chi tiết từng yêu cầu để thấy cùng lúc gia sư đang chờ, bị từ chối và được tiếp tục.
