// Nhãn và định dạng hiển thị dùng chung cho request, đơn ứng tuyển, lời mời (UC10, UC11, UC12, UC14)

export const TEACHING_MODES = [
  { value: 'ONLINE', label: 'Online' },
  { value: 'OFFLINE', label: 'In person' },
  { value: 'HYBRID', label: 'Hybrid' },
];

export const REQUEST_STATUS = {
  DRAFT: { label: 'Draft', tone: 'warning' },
  PENDING_MODERATION: { label: 'Under review', tone: 'warning' },
  OPEN: { label: 'Open', tone: 'success' },
  IN_PROGRESS: { label: 'In progress', tone: 'info' },
  CLOSED: { label: 'Closed', tone: 'info' },
  CANCELLED: { label: 'Cancelled', tone: 'error' },
  EXPIRED: { label: 'Expired', tone: 'error' },
};

export const APPLICATION_STATUS = {
  PENDING: { label: 'Pending', tone: 'warning' },
  CONTINUED: { label: 'Accepted', tone: 'success' },
  SKIPPED: { label: 'Skipped', tone: 'error' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'info' },
};

export const INVITATION_STATUS = {
  PENDING: { label: 'Pending', tone: 'warning' },
  ACCEPTED: { label: 'Accepted', tone: 'success' },
  DECLINED: { label: 'Declined', tone: 'error' },
  CANCELLED: { label: 'Cancelled', tone: 'info' },
};

const UNKNOWN_STATUS = { label: 'Unknown', tone: 'info' };

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
  return `${Number(value).toLocaleString('vi-VN')} ₫/session`;
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
