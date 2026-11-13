// Translate system messages only; user-entered content and API identifiers stay unchanged.
const MESSAGES = {
  'The file content does not match its file extension': 'Nội dung file không khớp với đuôi file. Hãy mở file bằng ứng dụng gốc và lưu hoặc xuất lại đúng định dạng, sau đó tải lên lại. Đổi tên đuôi file không chuyển đổi định dạng.',
  'File type is not allowed. Allowed types: pdf, doc/docx, ppt/pptx, xls/xlsx, jpg, png, mp4, zip': 'Định dạng file không được hỗ trợ. Vui lòng chọn PDF, Word, PowerPoint, Excel, JPG, PNG, MP4 hoặc ZIP.',
  'File must be 20 MB or smaller': 'File phải có dung lượng không quá 20 MB. Hãy nén file hoặc chọn file nhỏ hơn.',
  'A file is required for this material type': 'Vui lòng chọn file tài liệu trước khi tải lên.',
  'A link material must not include a file': 'Tài liệu dạng liên kết chỉ cần URL, không gửi kèm file.',
  'A URL is required for link material': 'Vui lòng nhập liên kết tài liệu.',
  'Enter a valid URL': 'Liên kết không hợp lệ. Vui lòng nhập URL đầy đủ bắt đầu bằng http:// hoặc https://.',
  'URL must start with http:// or https://': 'Liên kết phải bắt đầu bằng http:// hoặc https://.',
  'Something went wrong, please try again': 'Có lỗi xảy ra, vui lòng thử lại.',
  'Your account has been suspended or banned': 'Tài khoản của bạn đã bị tạm khóa hoặc cấm.',
  'Account not verified': 'Tài khoản chưa xác thực email.',
  'Account unavailable': 'Tài khoản không khả dụng.',
  'Account has no linked Google login': 'Tài khoản chưa liên kết đăng nhập Google.',
  'Invalid username or password': 'Email hoặc mật khẩu không đúng.',
  'Current password is incorrect': 'Mật khẩu hiện tại không đúng.',
  'New password must differ from the current password': 'Mật khẩu mới phải khác mật khẩu hiện tại.',
  'Password changed or account unavailable. Please try again': 'Mật khẩu đã thay đổi hoặc tài khoản không khả dụng. Vui lòng thử lại.',
  'The link is invalid or expired': 'Liên kết không hợp lệ hoặc đã hết hạn.',
  'This email is already registered': 'Email này đã được đăng ký.',
  'Email already existed': 'Email này đã tồn tại.',
  'Email already exists': 'Email này đã tồn tại.',
  'Input must be email': 'Vui lòng nhập địa chỉ email hợp lệ.',
  'Invalid email address': 'Địa chỉ email không hợp lệ.',
  'Password must be at least 8 characters': 'Mật khẩu phải có ít nhất 8 ký tự.',
  'Password must have at least 8 character': 'Mật khẩu phải có ít nhất 8 ký tự.',
  'Password must be at most 64 characters': 'Mật khẩu không được quá 64 ký tự.',
  'Password must contain at least one uppercase letter': 'Mật khẩu phải có ít nhất một chữ hoa.',
  'Password must contain at least one lowercase letter': 'Mật khẩu phải có ít nhất một chữ thường.',
  'Password must contain at least one digit': 'Mật khẩu phải có ít nhất một chữ số.',
  'Confirm password does not match': 'Mật khẩu xác nhận không khớp.',
  'You must agree to the Terms of Service': 'Bạn phải đồng ý với Điều khoản dịch vụ.',
  'Invalid or expired token': 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn.',
  'jwt expired': 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  'jwt malformed': 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
  'invalid signature': 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
  'Ticket invalid or expired': 'Phiên đăng ký không hợp lệ hoặc đã hết hạn.',
  'Google email is not verified': 'Email Google chưa được xác thực.',
  'Forbidden': 'Bạn không có quyền thực hiện thao tác này.',
  'Unauthorize': 'Vui lòng đăng nhập để tiếp tục.',
  'User not found': 'Không tìm thấy người dùng.',
  'Route not found': 'Không tìm thấy chức năng được yêu cầu.',
  'Not enough credits': 'Bạn không có đủ credits.',
  'Complete your tutor profile first': 'Vui lòng hoàn thiện hồ sơ gia sư trước.',
  'Your profile was just created, please reload and try again': 'Hồ sơ vừa được tạo. Vui lòng tải lại và thử lại.',
  'This profile is not available': 'Hồ sơ này không khả dụng.',
  'Tutor not found': 'Không tìm thấy gia sư.',
  'This tutor is no longer available': 'Gia sư này không còn khả dụng.',
  'Tutoring request not found': 'Không tìm thấy yêu cầu tìm gia sư.',
  'This request already has a conversation with a tutor and cannot be deleted': 'Yêu cầu này đã có cuộc trò chuyện với gia sư nên không thể xóa.',
  'This request is no longer open': 'Yêu cầu này không còn mở.',
  'You can only invite tutors to an open request': 'Bạn chỉ có thể mời gia sư vào yêu cầu đang mở.',
  'Selected student is not linked to your account': 'Học sinh đã chọn chưa liên kết với tài khoản của bạn.',
  'Tutor suggestions are only available for open requests': 'Chỉ có thể xem gợi ý gia sư cho yêu cầu đang mở.',
  'Only parent accounts can view tutor suggestions': 'Chỉ tài khoản phụ huynh được xem gợi ý gia sư.',
  'Only student accounts can view the student dashboard': 'Chỉ tài khoản học sinh được xem trang tổng quan học tập.',
  'You have already applied to this request': 'Bạn đã ứng tuyển vào yêu cầu này.',
  'You have already invited this tutor to this request': 'Bạn đã mời gia sư này vào yêu cầu này.',
  'Application not found': 'Không tìm thấy đơn ứng tuyển.',
  'Invitation not found': 'Không tìm thấy lời mời.',
  'This invitation is no longer available': 'Lời mời này không còn khả dụng.',
  'Conversation not found': 'Không tìm thấy cuộc trò chuyện.',
  'Only parent and tutor accounts can use chat': 'Chỉ phụ huynh và gia sư được sử dụng trò chuyện.',
  'This conversation is closed': 'Cuộc trò chuyện này đã đóng.',
  'Post not found': 'Không tìm thấy bài đăng.',
  'This post is under moderation and cannot be changed': 'Bài đăng đang được kiểm duyệt nên không thể thay đổi.',
  'Plan not found': 'Không tìm thấy gói dịch vụ.',
  'Credit pack not found': 'Không tìm thấy gói credits.',
  'Free plan price must be 0': 'Gói miễn phí phải có giá bằng 0.',
  'The Free plan cannot be purchased': 'Không thể mua gói miễn phí.',
  'This plan is not available for your role': 'Gói dịch vụ không dành cho vai trò của bạn.',
  'This credit pack is not available for your role': 'Gói credits không dành cho vai trò của bạn.',
  'Order not found': 'Không tìm thấy đơn thanh toán.',
  'Payment not found at gateway': 'Không tìm thấy giao dịch tại cổng thanh toán.',
  'Payment can no longer be cancelled': 'Không thể hủy giao dịch này.',
  'Payment gateway configuration is incomplete': 'Cấu hình cổng thanh toán chưa đầy đủ.',
  'Payment gateway is temporarily unavailable': 'Cổng thanh toán tạm thời không khả dụng. Vui lòng thử lại.',
  'Payment gateway request failed': 'Không thể gửi yêu cầu tới cổng thanh toán.',
  'Payment gateway order mismatch': 'Thông tin giao dịch tại cổng thanh toán không khớp.',
  'Payment gateway result is not confirmed': 'Kết quả thanh toán chưa được xác nhận.',
  'Invalid payment gateway response': 'Phản hồi từ cổng thanh toán không hợp lệ.',
  'Ambiguous payment gateway response': 'Không xác định được giao dịch tại cổng thanh toán.',
  'Invalid checkout URL': 'Liên kết thanh toán không hợp lệ.',
  'A valid payer IP address is required': 'Cần có địa chỉ IP hợp lệ của người thanh toán.',
  'Invalid webhook event': 'Sự kiện xác nhận thanh toán không hợp lệ.',
  'Invalid webhook signature': 'Chữ ký xác nhận thanh toán không hợp lệ.',
  'You cannot change your own account status': 'Bạn không thể thay đổi trạng thái tài khoản của chính mình.',
  'At least one active admin is required': 'Phải có ít nhất một quản trị viên đang hoạt động.',
  'The account is already ACTIVE': 'Tài khoản đã ở trạng thái đang hoạt động.',
  'The account is already SUSPENDED': 'Tài khoản đã ở trạng thái tạm khóa.',
  'The account is already BANNED': 'Tài khoản đã ở trạng thái bị cấm.',
  'If the email exists and is eligible, a reset link will be sent': 'Nếu email tồn tại và đủ điều kiện, liên kết đặt lại mật khẩu sẽ được gửi.',
  'Password reset successfully. Please log in': 'Đã đặt lại mật khẩu. Vui lòng đăng nhập.',
  'Password changed successfully': 'Đã đổi mật khẩu thành công.',
  'Invalid ID format': 'Mã định danh không hợp lệ.',
  'Invalid id': 'Mã định danh không hợp lệ.',
  'Invalid request id': 'Mã yêu cầu không hợp lệ.',
  'Invalid plan id': 'Mã gói dịch vụ không hợp lệ.',
  'Invalid credit pack id': 'Mã gói credits không hợp lệ.',
  'Invalid status': 'Trạng thái không hợp lệ.',
  'Invalid session mode': 'Hình thức học không hợp lệ.',
  'Price must be positive': 'Giá phải lớn hơn 0.',
  'At least one weight must be greater than 0': 'Ít nhất một trọng số phải lớn hơn 0.',
  'Session mode must be ONLINE, OFFLINE or HYBRID': 'Vui lòng chọn hình thức học trực tuyến, trực tiếp hoặc kết hợp.',
  'Location is required for in-person or hybrid sessions': 'Vui lòng nhập địa điểm cho buổi học trực tiếp hoặc kết hợp.',
  'Duration must be at least 1 month': 'Thời hạn phải từ 1 tháng trở lên.',
  'Duration must be at most 12 months': 'Thời hạn không được quá 12 tháng.',
  'Date must be in YYYY-MM-DD format': 'Ngày phải có định dạng năm-tháng-ngày (YYYY-MM-DD).',
  'Date is invalid': 'Ngày không hợp lệ.',
  "'from' must be before or equal to 'to'": 'Ngày bắt đầu không được sau ngày kết thúc.',
  'Class limit must be a number or null (unlimited)': 'Giới hạn lớp phải là số hoặc để trống nếu không giới hạn.',
  'SMS reminders must be true or false': 'Vui lòng bật hoặc tắt tính năng nhắc lịch qua SMS.',
  'Availability must be true or false': 'Vui lòng bật hoặc tắt trạng thái cung cấp.',
  'is_active must be true or false': 'Vui lòng bật hoặc tắt trạng thái hoạt động.',
  'Address visibility must be true or false': 'Vui lòng bật hoặc tắt hiển thị địa chỉ.',
  'Target role must be TUTOR or PARENT': 'Vai trò áp dụng phải là gia sư hoặc phụ huynh.',
  'Availability must be AVAILABLE or NOT_AVAILABLE': 'Vui lòng chọn trạng thái nhận học viên hoặc tạm ngừng nhận.',
  'Result must be SUCCESS or FAILED': 'Kết quả phải là thành công hoặc thất bại.',
  'Status must be DRAFT or PUBLISHED': 'Trạng thái phải là bản nháp hoặc đã xuất bản.',
  'Status must be DRAFT, PUBLISHED or HIDDEN': 'Trạng thái phải là bản nháp, đã xuất bản hoặc đã ẩn.',
  'End date must not be before start date': 'Ngày kết thúc không được trước ngày bắt đầu.',
  'Graduation year is too early': 'Năm tốt nghiệp quá xa trong quá khứ.',
  'Graduation year is too late': 'Năm tốt nghiệp quá xa trong tương lai.',
  'Filter is too long': 'Nội dung bộ lọc quá dài.',
  'Minimum budget must not exceed maximum budget': 'Ngân sách tối thiểu không được lớn hơn ngân sách tối đa.',
};

const FIELDS = {
  'Email': 'Email', 'Full name': 'Họ tên', 'Password': 'Mật khẩu', 'Confirm password': 'Mật khẩu xác nhận',
  'Headline': 'Tiêu đề giới thiệu', 'Bio': 'Giới thiệu', 'About you': 'Giới thiệu bản thân',
  'Address': 'Địa chỉ', 'Start date': 'Ngày bắt đầu', 'End date': 'Ngày kết thúc',
  'Company': 'Đơn vị', 'School': 'Trường học', 'Degree': 'Bằng cấp', 'Graduation year': 'Năm tốt nghiệp',
  'Experience title': 'Vị trí công việc', 'Achievement title': 'Thành tích',
  'Name': 'Tên', 'Reason': 'Lý do', 'Monthly price': 'Giá hàng tháng', 'Monthly credits': 'Credits hàng tháng',
  'Price': 'Giá', 'Credit amount': 'Số credits', 'AI quota': 'Hạn mức AI', 'Class limit': 'Giới hạn lớp',
  'Title': 'Tiêu đề', 'Description': 'Mô tả', 'Subject': 'Môn học', 'Grade level': 'Khối lớp',
  'Schedule': 'Lịch học', 'Budget': 'Ngân sách', 'Location': 'Địa điểm', 'Message': 'Tin nhắn',
  'Note': 'Lời nhắn', 'Page': 'Số trang', 'Limit': 'Số mục mỗi trang', 'Request title': 'Tiêu đề yêu cầu',
  'ID': 'Mã định danh', 'Request': 'Yêu cầu', 'Plan': 'Gói dịch vụ', 'Credit pack': 'Gói credits',
  'Ticket': 'Phiên đăng ký', 'Duration': 'Thời hạn', 'Quantity': 'Số lượng', 'Weight': 'Trọng số',
  'Search text': 'Từ khóa tìm kiếm', 'Role': 'Vai trò', 'Target role': 'Vai trò áp dụng',
  'Status': 'Trạng thái', 'Account status': 'Trạng thái tài khoản', 'Payment method': 'Phương thức thanh toán',
  'Item type': 'Loại gói mua', 'Type': 'Loại giao dịch',
};

const STATES = {
  PENDING: 'đang chờ', DRAFT: 'bản nháp', ACTIVE: 'đang hoạt động', SUSPENDED: 'tạm khóa', BANNED: 'bị cấm',
  OPEN: 'đang mở', CLOSED: 'đã đóng', CANCELLED: 'đã hủy', EXPIRED: 'đã hết hạn',
  ACCEPTED: 'đã chấp nhận', DECLINED: 'đã từ chối', CONTINUED: 'đã tiếp tục trao đổi',
  SKIPPED: 'đã bỏ qua', WITHDRAWN: 'đã rút', IN_PROGRESS: 'đang thực hiện',
  CONFIRMED: 'đã xác nhận', REJECTED: 'đã từ chối', SUCCESS: 'thành công', FAILED: 'thất bại',
  PUBLISHED: 'đã xuất bản', HIDDEN: 'đã ẩn', COMPLETED: 'đã hoàn thành',
  TUTOR: 'gia sư', PARENT: 'phụ huynh', STUDENT: 'học sinh', ADMIN: 'quản trị viên',
};

export const translateSystemMessage = (message, success = false) => {
  if (typeof message !== 'string' || !message) return 'Có lỗi xảy ra, vui lòng thử lại.';
  if (Object.hasOwn(MESSAGES, message)) return MESSAGES[message];
  if (/[ăâđêôơưàáảãạèéẻẽẹìíỉĩịòóỏõọùúủũụỳýỷỹỵ]/iu.test(message)) {
    return message.replace(/\b[A-Z_]{3,}\b/g, (value) => STATES[value] || value);
  }
  let match = /^(.+) is required$/.exec(message);
  if (match) return FIELDS[match[1]] ? `Vui lòng nhập ${FIELDS[match[1]].toLowerCase()}.` : 'Vui lòng điền thông tin bắt buộc.';
  match = /^(.+) must be at most (\d+) characters$/.exec(message);
  if (match) return `${FIELDS[match[1]] || 'Nội dung'} không được quá ${match[2]} ký tự.`;
  match = /^(.+) must be at most (\d+) words$/.exec(message);
  if (match) return `${FIELDS[match[1]] || 'Nội dung'} không được quá ${match[2]} từ.`;
  match = /^(.+) must be at least (\d+)$/.exec(message);
  if (match) return `${FIELDS[match[1]] || 'Giá trị'} phải từ ${match[2]} trở lên.`;
  match = /^(.+) must be at most (\d+)$/.exec(message);
  if (match) return `${FIELDS[match[1]] || 'Giá trị'} không được quá ${match[2]}.`;
  match = /^(.+) must be greater than (\d+)$/.exec(message);
  if (match) return `${FIELDS[match[1]] || 'Giá trị'} phải lớn hơn ${match[2]}.`;
  match = /^(.+) must be one of these \[.*\]$/.exec(message);
  if (match) return `${FIELDS[match[1]] || 'Lựa chọn'} không hợp lệ. Vui lòng chọn trong danh sách.`;
  match = /^(.+) (?:must be a (?:whole number|number|integer)|cannot be negative|is too large|is not a valid date)/.exec(message);
  if (match) return `${FIELDS[match[1]] || 'Giá trị đã nhập'} không hợp lệ. Vui lòng kiểm tra lại.`;
  match = /^Only (parent|tutor|student|admin) accounts can use this feature$/.exec(message);
  if (match) return `Chức năng này chỉ dành cho ${{ parent: 'phụ huynh', tutor: 'gia sư', student: 'học sinh', admin: 'quản trị viên' }[match[1]]}.`;
  if (/^Only pending (applications|invitations|orders) can be /.test(message)) {
    return 'Chỉ có thể thực hiện thao tác này khi yêu cầu còn đang chờ xử lý.';
  }
  if (/^This request can no longer be edited/.test(message)) return 'Yêu cầu này không còn cho phép chỉnh sửa.';
  if (/successfully/i.test(message) || success === true) return 'Thao tác thành công.';
  return 'Không thể thực hiện yêu cầu. Vui lòng kiểm tra thông tin và thử lại.';
};
