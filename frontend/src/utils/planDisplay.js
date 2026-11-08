// Tên hiển thị của plan và role trên màn Plans & Pricing

const PLAN_TITLES = {
  FREE_DEFAULT: 'Miễn phí',
  FREE: 'Miễn phí',
  Free: 'Miễn phí',
  PRO: 'Pro',
};

export const getPlanTitle = (planName) => {
  const title = PLAN_TITLES[planName];
  if (!title) {
    return planName;
  }
  return title;
};

export const PACK_ROLE_OPTIONS = [
  { value: 'TUTOR', label: 'Gia sư' },
  { value: 'PARENT', label: 'Phụ huynh' },
];

// target_role = null nghĩa là gói dùng cho mọi role
export const getTargetRoleLabel = (targetRole) => {
  if (targetRole === 'TUTOR') {
    return 'Gia sư';
  }
  if (targetRole === 'PARENT') {
    return 'Phụ huynh';
  }
  return 'Tất cả vai trò';
};

// Giới hạn số lớp: null = không giới hạn
export const getClassLimitLabel = (maxClassrooms) => {
  if (maxClassrooms === null || maxClassrooms === undefined) {
    return 'Không giới hạn';
  }
  return maxClassrooms.toLocaleString('vi-VN');
};
