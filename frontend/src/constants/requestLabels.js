// Nhãn và định dạng hiển thị dùng chung cho request, đơn ứng tuyển, lời mời (UC10, UC11, UC12, UC14)

export const TEACHING_MODES = [
  { value: 'ONLINE', label: 'Học online' },
  { value: 'OFFLINE', label: 'Học trực tiếp' },
  { value: 'HYBRID', label: 'Kết hợp' },
];

export const REQUEST_STATUS = {
  DRAFT: { label: 'Nháp', tone: 'warning' },
  PENDING_MODERATION: { label: 'Đang kiểm duyệt', tone: 'warning' },
  OPEN: { label: 'Đang mở', tone: 'success' },
  IN_PROGRESS: { label: 'Đang thực hiện', tone: 'info' },
  CLOSED: { label: 'Đã đóng', tone: 'info' },
  CANCELLED: { label: 'Đã hủy', tone: 'error' },
  EXPIRED: { label: 'Hết hạn', tone: 'error' },
};

export const APPLICATION_STATUS = {
  PENDING: { label: 'Đang chờ', tone: 'warning' },
  CONTINUED: { label: 'Đã chấp nhận', tone: 'success' },
  SKIPPED: { label: 'Đã bỏ qua', tone: 'error' },
  WITHDRAWN: { label: 'Đã rút', tone: 'info' },
};

export const INVITATION_STATUS = {
  PENDING: { label: 'Đang chờ', tone: 'warning' },
  ACCEPTED: { label: 'Đã chấp nhận', tone: 'success' },
  DECLINED: { label: 'Đã từ chối', tone: 'error' },
  CANCELLED: { label: 'Đã hủy', tone: 'info' },
};

const UNKNOWN_STATUS = { label: 'Không rõ', tone: 'info' };

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
  DRAFT: { label: 'Draft', tone: 'warning' },
  PUBLISHED: { label: 'Published', tone: 'success' },
  PENDING_MODERATION: { label: 'Under review', tone: 'warning' },
  HIDDEN: { label: 'Hidden', tone: 'info' },
  DELETED: { label: 'Deleted', tone: 'error' },
};

export const AVAILABILITY_OPTIONS = [
  { value: 'AVAILABLE', label: 'Available for new students' },
  { value: 'NOT_AVAILABLE', label: 'Not available right now' },
];

// Thông báo backend trả về (409) khi gia sư chưa tạo hồ sơ; các trang gia sư dùng để chỉ đường tới /tutor/profile
export const PROFILE_REQUIRED_MESSAGE = 'Complete your tutor profile first';
