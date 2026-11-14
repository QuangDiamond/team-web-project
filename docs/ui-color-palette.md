# Palette TuConnector · Cam sáng và trắng ngà

Bảng màu chuẩn bị cho đợt chuyển đổi giao diện sáng của toàn website. Nền diện rộng dùng xám ấm rất nhạt, thẻ dùng trắng ngà, đầu trang tìm kiếm dùng đào nhạt dạng màu đặc. Cam tập trung ở hành động chính và lựa chọn đang hoạt động. Giá có xanh ngọc đậm trên nền mint như demo đã chốt.

## Màu theo vai trò

| Token CSS dự kiến | Màu | Dùng ở đâu |
| --- | --- | --- |
| `--color-canvas` | `#FAF9F6` | Nền trang công khai, màn xác thực và vùng nội dung dashboard |
| `--color-surface` | `#FFFEFC` | Thẻ, header, modal, bảng, ô nhập và danh sách thả xuống |
| `--color-surface-raised` | `#FFFFFF` | Vùng nhỏ cần phân biệt với thẻ trắng ngà, như ô nhập đang chỉnh sửa |
| `--color-sidebar` | `#FCFAF7` | Sidebar, drawer menu và danh sách hội thoại |
| `--color-surface-subtle` | `#F6F1EC` | Đầu bảng, vùng đọc hoặc vùng thông tin phụ |
| `--color-border` | `#ECE4DC` | Viền thẻ, đường chia hàng, separator |
| `--color-control-border` | `#DDD3CB` | Viền mặc định của ô nhập và bộ lọc |
| `--color-text` | `#28252B` | Tiêu đề, nội dung và số liệu chính |
| `--color-text-muted` | `#625851` | Nội dung phụ, gợi ý nhập liệu và nhãn thời gian |
| `--color-primary` | `#F26B3A` | Logo, biểu tượng trang trí và điểm nhấn nhỏ |
| `--color-primary-strong` | `#C04A24` | Nút chính, link, icon hành động và trang đang chọn |
| `--color-primary-strong-hover` | `#A63F24` | Hover và pressed của nút chính |
| `--color-primary-soft` | `#FFF4ED` | Mục đang chọn, chip danh mục, tab và hàng được chọn |
| `--color-hero` | `#FFF2EB` | Hero công khai, banner chào trong dashboard khi màn cần điểm nhấn |
| `--color-on-primary` | `#FFFFFF` | Chữ và icon trên nút cam đậm |
| `--color-focus` | `#A63F24` | Viền focus 2 px, cách điều khiển 2 px |
| `--color-price` / `--color-price-soft` | `#00634F` / `#DFF8EE` | Học phí, ngân sách, giá gói và tổng tiền. Dùng nền mint cho giá chính cần quét nhanh |
| `--color-rating` / `--color-rating-soft` | `#805011` / `#FFF7E3` | Sao, điểm đánh giá và badge đánh giá |
| `--color-info` / `--color-info-soft` | `#395476` / `#F0F6FC` | Ngày đăng, giờ học, thông tin hệ thống và trạng thái đang xử lý |
| `--color-success` / `--color-success-soft` | `#236257` / `#EFF8F1` | Đã xác nhận, hoạt động, hoàn thành và thanh toán thành công |
| `--color-warning` / `--color-warning-soft` | `#805011` / `#FFF7E3` | Chờ xác nhận, sắp đến hạn và nội dung cần chú ý |
| `--color-error` / `--color-error-soft` | `#A52F35` / `#FFF0F1` | Lỗi, giao dịch thất bại, khóa tài khoản và thao tác nguy hiểm |
| `--color-neutral` / `--color-neutral-soft` | `#625851` / `#F6F1EC` | Bản nháp, đã đóng, đã hủy, hết hạn và trạng thái không khả dụng |
| `--color-overlay` | `rgba(40, 37, 43, 0.45)` | Lớp phủ modal và drawer |
| `--shadow-card` | `0 4px 12px rgba(82, 59, 42, 0.05)` | Bóng nhẹ cho thẻ nổi trên nền trang |

## Áp dụng lên thành phần dùng chung

| Thành phần | Cách dùng màu |
| --- | --- |
| Navbar, sidebar, header | Navbar và header dùng surface, sidebar dùng sidebar. Mục đang chọn dùng primary-soft và chữ primary-strong. Giữ nhãn hoặc biểu tượng để nhận ra mục đang chọn |
| Form, tìm kiếm, bộ lọc | Ô nhập trên surface, viền control-border, placeholder text-muted. Focus dùng focus. Lỗi dùng error kèm thông báo ngay ô liên quan |
| Nút và phân trang | Nút chính và số trang hiện tại dùng primary-strong với on-primary. Nút phụ dùng surface và chữ text. Disabled dùng nền neutral-soft, chữ neutral và thuộc tính disabled |
| Thẻ, bảng và danh sách | Thẻ dùng surface + border, bảng dùng surface-subtle ở đầu bảng và canvas cho hàng xen kẽ. Giá trên thẻ danh sách dùng price/price-soft với số đậm 15 px |
| Lịch và tiến độ | Ô ngày hôm nay dùng primary-soft, buổi học dùng info, đã hoàn thành dùng success, đến hạn hoặc cần xác nhận dùng warning. Giữ chữ trạng thái và giờ học |
| Modal, dropdown, toast | Modal và dropdown dùng surface. Toast và banner dùng cặp màu theo nội dung thông báo. Hộp xác nhận xóa dùng nút error với chữ trắng |
| Chat | Tin gửi dùng primary-soft với chữ text, tin nhận dùng surface với chữ text. Tin chưa đọc dùng nhãn và chấm primary-strong. Giữ cùng quy tắc trong chat nổi |
| Loading, rỗng và lỗi | Skeleton dùng surface-subtle, thông tin rỗng dùng text-muted, cảnh báo lỗi dùng error-soft kèm chữ error. Giảm hoặc tắt chuyển động khi người dùng chọn giảm chuyển động |
| Biểu đồ | Dùng `#C04A24`, `#395476`, `#236257`, `#805011` cho chuỗi dữ liệu. Nhãn dùng text, đường lưới dùng border. Phân biệt chuỗi bằng nhãn, dấu hoặc kiểu nét bên cạnh màu |
| Ảnh, logo và ảnh đại diện | Ảnh giữ màu gốc. Avatar chữ cái dùng nền đào, mint, lam hoặc hổ phách nhạt và chữ đậm tương ứng |
| Biên nhận và bản in | Khi in, dùng nền trắng, chữ text và viền mảnh. Diễn đạt trạng thái thanh toán bằng chữ để vẫn đọc rõ khi in đen trắng |

## Đối chiếu toàn bộ màn hình

Đối chiếu theo router hiện tại. Các route chung được nhóm theo cùng quy tắc màu để dễ chuyển đổi từng đợt.

| Nhóm màn hình | Route | Áp dụng |
| --- | --- | --- |
| Trang chủ | `/` | Nền canvas, hero màu đào, luân phiên section canvas và surface, footer dùng surface-subtle để kết thúc trang |
| Tìm gia sư và yêu cầu | `/tutors`, `/requests` | Hero đào đặc, thanh tìm kiếm và thẻ trắng ngà, giá mint, sao hổ phách, ngày đăng xanh lam |
| Hồ sơ và tham gia lớp | `/profile`, `/tutors/:profileId`, `/parents/:userId`, `/join-class`, `/join-class/:code` | Cover màu đào hoặc ảnh gốc, thẻ surface, thông tin lịch và mã lớp dùng info, trạng thái nhận lớp dùng success hoặc neutral |
| Xác thực | `/login`, `/register`, `/register/success`, `/register/complete`, `/forgot-password`, `/reset-password` | Nền canvas, panel giới thiệu đào nhạt nếu có, form trắng ngà, thông báo theo trạng thái |
| Tổng quan | `/tutor/dashboard`, `/parent/dashboard`, `/student/dashboard`, `/admin/dashboard` | Cùng một khung sidebar/header. Thẻ thống kê nền surface, icon nhấn theo nội dung. Thống kê admin dùng màu biểu đồ |
| Gia sư tìm việc | `/tutor/requests`, `/tutor/requests/suggested`, `/tutor/requests/saved`, `/tutor/requests/:id`, `/tutor/applications`, `/tutor/invitations` | Danh sách surface, khu vực gợi ý primary-soft, giá mint, trạng thái hồ sơ và lời mời theo màu ngữ nghĩa |
| Hồ sơ và bài đăng gia sư | `/tutor/profile`, `/tutor/posts`, `/tutor/posts/new`, `/tutor/posts/:id/edit` | Bao form bằng surface. Dùng cam cho lưu hoặc đăng, mint cho giá, neutral cho nháp |
| Phụ huynh tìm gia sư | `/parent/requests`, `/parent/requests/new`, `/parent/requests/:id`, `/parent/requests/:id/edit`, `/parent/requests/:requestId/suggestions`, `/parent/suggestions`, `/parent/invitations` | Danh sách và form surface. Ngân sách mint, danh mục màu đào, trạng thái đơn ứng tuyển dùng success, warning, neutral hoặc error theo ý nghĩa |
| Lớp và tài liệu | `/tutor/classes`, `/tutor/classes/:id`, `/parent/classes`, `/parent/classes/:id`, `/student/classes`, `/student/classes/:id` | Tab đang chọn màu đào, bài tập và tài liệu trên surface, thông báo lớp dùng info |
| Bài tập và điểm | `/tutor/classes/:id/assignments/new`, `/tutor/classes/:id/assignments/:assignmentId/edit`, `/tutor/classes/:id/assignments/:assignmentId/grade`, `/student/assignments` | Form trên surface, hạn nộp info hoặc warning, điểm dùng chữ text, trạng thái nộp/chấm có nhãn |
| Lịch và tiến độ học sinh | `/tutor/schedule`, `/student/schedule`, `/student/parent-links`, `/parent/children`, `/parent/children/:childId` | Áp dụng màu lịch, tiến độ và trạng thái liên kết từ bảng thành phần |
| Tin nhắn, kết nối | `/tutor/messages`, `/tutor/messages/:conversationId`, `/parent/messages`, `/parent/messages/:conversationId`, `/tutor/contracts`, `/tutor/connections`, `/parent/contracts`, `/parent/connections` | Chat theo màu tin gửi/nhận. Điều khoản dùng surface-subtle, học phí mint. Trạng thái thỏa thuận có nhãn rõ |
| Thông báo và bảo mật | `/tutor/notifications`, `/parent/notifications`, `/student/notifications`, `/admin/notifications`, `/tutor/change-password`, `/parent/change-password`, `/student/change-password`, `/admin/change-password` | Hàng chưa đọc dùng primary-soft, nhóm loại thông báo dùng màu ngữ nghĩa, form bảo mật theo màu input và lỗi chung |
| Credits, thanh toán và biên nhận | `/tutor/credits`, `/parent/credits`, `/tutor/checkout`, `/parent/checkout`, `/tutor/payment/result`, `/parent/payment/result`, `/tutor/receipts/:orderCode`, `/parent/receipts/:orderCode` | Số dư và tổng tiền mint, gói đang chọn màu đào, kết quả thanh toán theo cặp màu trạng thái. Khoản cộng/trừ luôn có dấu và nhãn |
| Quản trị | `/admin/plans`, `/admin/categories`, `/admin/users`, `/admin/users/:userId`, `/admin/moderation`, `/admin/audit-logs` | Bảng nền ấm, hàng xen kẽ, badge trạng thái thống nhất. Chỉ thao tác và trạng thái nguy hiểm dùng đỏ |
| Lỗi và đường dẫn chuyển tiếp | Route lỗi, `*`, `/payment`, `/dashboard`, `/change-password`, `/credits`, `/checkout`, `/payment/result`, `/receipts/:orderCode`, `/parent/applications`, `/parent/requests/:id/applications`, `/parent/ai-suggestions`, `/parent/requests/:requestId/ai-suggestions` | Màn lỗi dùng canvas/surface và icon error hoặc info tùy tình huống. Đường dẫn chuyển tiếp dùng palette của màn đích |

## Thứ tự chuyển đổi

1. Khai báo token trong `frontend/src/styles/index.css`. Rà soát các biến cũ cùng tên trước khi đổi giá trị. Tách chữ trên nền cam sang `--color-on-primary` và phân biệt nền thẻ với nền trang. Rà các biến trùng như `--color-warning`.
2. Áp dụng với Gia sư và Yêu cầu trong `tutorSearch.css` để đối chiếu demo. Sau đó chuyển trang chủ, hồ sơ công khai và nhóm xác thực.
3. Chuyển khung dùng chung của bốn dashboard, rồi đến nút, form, bảng, badge, modal, phân trang và chat nổi. Tiếp tục thay màu viết cứng trong CSS từng màn theo bảng route.
4. Kiểm tra giao diện máy tính và điện thoại theo từng vai trò, gồm hover, focus, disabled, bảng dài, biểu đồ, thông báo, biểu mẫu lỗi và bản in. Chạy lint và build frontend sau mỗi đợt áp dụng.

Mục tiêu tương phản khi áp dụng là **4,5:1** cho chữ thông thường và **3:1** cho đường viền hoặc dấu hiệu cần thiết để nhận biết điều khiển. Mỗi trạng thái cần chữ, ký hiệu hoặc biểu tượng hỗ trợ đọc cùng màu.
