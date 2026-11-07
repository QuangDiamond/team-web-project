// Nhãn hiển thị cho màn User Management (UC37)

export const USER_ROLE_OPTIONS = [
  { value: 'TUTOR', label: 'Tutor' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'STUDENT', label: 'Student' },
  { value: 'ADMIN', label: 'Admin' },
];

// Màu badge theo Figma: Active xanh, Suspended vàng, Banned đỏ
export const USER_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active', tone: 'green' },
  { value: 'SUSPENDED', label: 'Suspended', tone: 'amber' },
  { value: 'BANNED', label: 'Banned', tone: 'red' },
];

const AUDIT_ACTION_LABELS = {
  LOCK_USER: 'Account locked',
  UNLOCK_USER: 'Account reactivated',
  UPDATE_SETTINGS: 'Settings updated',
  UPDATE_PLAN: 'Plan updated',
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
    buttonLabel: 'Suspend',
    title: 'Suspend this account?',
    description: 'The user is signed out and cannot sign in until an admin reactivates the account.',
    submitLabel: 'Suspend account',
    danger: true,
  },
  BAN: {
    targetStatus: 'BANNED',
    buttonLabel: 'Ban',
    title: 'Ban this account?',
    description: 'Use for serious violations. The user is signed out and cannot sign in. An admin can still reactivate the account later.',
    submitLabel: 'Ban account',
    danger: true,
  },
  REACTIVATE: {
    targetStatus: 'ACTIVE',
    buttonLabel: 'Reactivate',
    title: 'Reactivate this account?',
    description: 'The user can sign in and use TuConnector again.',
    submitLabel: 'Reactivate account',
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
