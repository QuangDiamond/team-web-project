import { getAuditActionLabel } from '../../utils/userDisplay';
const LABELS = {
  CRITICAL: 'Khẩn cấp',
  HIGH: 'Cao',
  MEDIUM: 'Trung bình',
  LOW: 'Thấp',
  PENDING: 'Chờ xử lý',
  INVESTIGATING: 'Đang xác minh',
  RESOLVED: 'Đã xử lý',
  DISMISSED: 'Đã bỏ qua',
  POST: 'Bài đăng gia sư',
  REQUEST: 'Yêu cầu tìm gia sư',
  REVIEW: 'Đánh giá',
  MESSAGE: 'Tin nhắn',
  USER: 'Tài khoản',
  CLASSROOM: 'Lớp học',
  NONE: 'Bỏ qua báo cáo',
  CONTENT_HIDDEN: 'Tạm ẩn nội dung',
  CONTENT_REMOVED: 'Gỡ bỏ nội dung',
  WARNING_SENT: 'Gửi cảnh cáo',
  USER_BANNED: 'Khóa tài khoản'
};
export const getModerationLabel = value => LABELS[value] || getAuditActionLabel(value);
export const RESOLUTION_ACTIONS = [{
  value: 'NONE',
  title: 'Bỏ qua báo cáo',
  description: 'Không có vi phạm hoặc chưa đủ bằng chứng.'
}, {
  value: 'CONTENT_HIDDEN',
  title: 'Tạm ẩn nội dung',
  description: 'Ẩn nội dung khỏi tìm kiếm công khai để chờ đính chính.'
}, {
  value: 'CONTENT_REMOVED',
  title: 'Gỡ bỏ nội dung',
  description: 'Gỡ nội dung vi phạm nghiêm trọng.'
}, {
  value: 'WARNING_SENT',
  title: 'Gửi cảnh cáo',
  description: 'Thông báo chính thức về vi phạm điều khoản dịch vụ.'
}, {
  value: 'USER_BANNED',
  title: 'Khóa tài khoản',
  description: 'Áp dụng với vi phạm nghiêm trọng hoặc tái phạm.'
}];
