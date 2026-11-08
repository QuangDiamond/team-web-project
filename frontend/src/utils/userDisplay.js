// Nhãn hiển thị cho màn User Management (UC37)

export const USER_ROLE_OPTIONS = [
  { value: 'TUTOR', label: 'Gia sư' },
  { value: 'PARENT', label: 'Phụ huynh' },
  { value: 'STUDENT', label: 'Học sinh' },
  { value: 'ADMIN', label: 'Quản trị viên' },
];

// Màu badge theo Figma: Active xanh, Suspended vàng, Banned đỏ
export const USER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Đang hoạt động', tone: 'green' },
  { value: 'SUSPENDED', label: 'Tạm khóa', tone: 'amber' },
  { value: 'BANNED', label: 'Bị cấm', tone: 'red' },
];

const AUDIT_ACTION_LABELS = {
  LOCK_USER: 'Đã khóa tài khoản',
  UNLOCK_USER: 'Đã kích hoạt lại tài khoản',
  UPDATE_SETTINGS: 'Đã cập nhật cài đặt',
  UPDATE_PLAN: 'Đã cập nhật gói dịch vụ',
};

export const getUserRoleLabel = (role) => {
  const option = USER_ROLE_OPTIONS.find((item) => item.value === role);
  if (!option) {
    return role;
  }
  return option.label;
};

export const getUserStatusOption = (status) => {
  const option = USER_STATUS_OPTIONS.find((item) => item.value === status);
  if (!option) {
    return { value: status, label: status, tone: 'gray' };
  }
  return option;
};

export const getAuditActionLabel = (action) => {
  const label = AUDIT_ACTION_LABELS[action];
  if (!label) {
    return action;
  }
  return label;
};

// Lấy chữ cái đầu của tối đa 2 từ trong tên, vd: "Lai Huu" -> "LH"
export const getInitials = (fullName) => {
  if (!fullName) {
    return 'U';
  }
  const words = fullName.trim().split(/\s+/).slice(0, 2);
  const letters = words.map((word) => word.charAt(0).toUpperCase());
  return letters.join('');
};

// Các thao tác đổi trạng thái (UC37 bước 3): nút, trạng thái đích, nội dung hộp thoại
export const STATUS_ACTIONS = {
  SUSPEND: {
    targetStatus: 'SUSPENDED',
    buttonLabel: 'Tạm khóa',
    title: 'Tạm khóa tài khoản này?',
    description: 'Người dùng sẽ bị đăng xuất và không thể đăng nhập cho đến khi quản trị viên kích hoạt lại tài khoản.',
    submitLabel: 'Tạm khóa tài khoản',
    danger: true,
  },
  BAN: {
    targetStatus: 'BANNED',
    buttonLabel: 'Cấm tài khoản',
    title: 'Cấm tài khoản này?',
    description: 'Áp dụng cho vi phạm nghiêm trọng. Người dùng sẽ bị đăng xuất và không thể đăng nhập. Quản trị viên vẫn có thể kích hoạt lại tài khoản sau này.',
    submitLabel: 'Cấm tài khoản',
    danger: true,
  },
  REACTIVATE: {
    targetStatus: 'ACTIVE',
    buttonLabel: 'Kích hoạt lại',
    title: 'Kích hoạt lại tài khoản này?',
    description: 'Người dùng có thể đăng nhập và sử dụng lại TuConnector.',
    submitLabel: 'Kích hoạt lại tài khoản',
    danger: false,
  },
};

// Thao tác được phép theo trạng thái hiện tại (không đổi sang chính trạng thái đang có)
export const getAvailableStatusActions = (accountStatus) => {
  if (accountStatus === 'ACTIVE') {
    return ['SUSPEND', 'BAN'];
  }
  if (accountStatus === 'SUSPENDED') {
    return ['REACTIVATE', 'BAN'];
  }
  return ['REACTIVATE', 'SUSPEND'];
};
