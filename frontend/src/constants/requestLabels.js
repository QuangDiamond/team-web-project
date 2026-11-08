// Nhãn và định dạng hiển thị dùng chung cho request, đơn ứng tuyển, lời mời (UC10, UC11, UC12, UC14)

export const TEACHING_MODES = [
  { value: 'ONLINE', label: "Trực tuyến" },
  { value: 'OFFLINE', label: "Trực tiếp" },
  { value: 'HYBRID', label: "Kết hợp" },
];

export const REQUEST_STATUS = {
  DRAFT: { label: "Bản nháp", tone: 'warning' },
  PENDING_MODERATION: { label: "Đang kiểm duyệt", tone: 'warning' },
  OPEN: { label: "Đang mở", tone: 'success' },
  IN_PROGRESS: { label: "Đang thực hiện", tone: 'info' },
  CLOSED: { label: "Đã đóng", tone: 'info' },
  CANCELLED: { label: "Đã hủy", tone: 'error' },
  EXPIRED: { label: "Đã hết hạn", tone: 'error' },
};

export const APPLICATION_STATUS = {
  PENDING: { label: "Đang chờ", tone: 'warning' },
  CONTINUED: { label: "Đã chấp nhận", tone: 'success' },
  SKIPPED: { label: "Đã bỏ qua", tone: 'error' },
  WITHDRAWN: { label: "Đã rút", tone: 'info' },
};

export const INVITATION_STATUS = {
  PENDING: { label: "Đang chờ", tone: 'warning' },
  ACCEPTED: { label: "Đã chấp nhận", tone: 'success' },
  DECLINED: { label: "Đã từ chối", tone: 'error' },
  CANCELLED: { label: "Đã hủy", tone: 'info' },
};

const UNKNOWN_STATUS = { label: "Không xác định", tone: 'info' };

export const getStatusBadge = (statusMap, status) => {
  if (statusMap[status]) {
    return statusMap[status];
  }
  return UNKNOWN_STATUS;
};

export const getModeLabel = (mode) => {
  const found = TEACHING_MODES.find((item) => item.value === mode);
  if (found) {
    return found.label;
  }
  return '—';
};

export const formatBudget = (value) => {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  return `${Number(value).toLocaleString('vi-VN')} ₫/buổi`;
};

export const POST_STATUS = {
  DRAFT: { label: "Bản nháp", tone: 'warning' },
  PUBLISHED: { label: "Đã đăng", tone: 'success' },
  PENDING_MODERATION: { label: "Đang kiểm duyệt", tone: 'warning' },
  HIDDEN: { label: "Đã ẩn", tone: 'info' },
  DELETED: { label: "Đã xóa", tone: 'error' },
};

export const AVAILABILITY_OPTIONS = [
  { value: 'AVAILABLE', label: "Đang nhận học sinh mới" },
  { value: 'NOT_AVAILABLE', label: "Hiện chưa nhận học sinh" },
];

// Thông báo backend trả về (409) khi gia sư chưa tạo hồ sơ; các trang gia sư dùng để chỉ đường tới /tutor/profile
export const PROFILE_REQUIRED_MESSAGE = 'Complete your tutor profile first';
