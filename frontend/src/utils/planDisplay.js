// Tên hiển thị của plan và role trên màn Plans & Pricing

const PLAN_TITLES = {
  FREE_DEFAULT: 'Free',
  FREE: 'Free',
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
  { value: 'TUTOR', label: 'Tutor' },
  { value: 'PARENT', label: 'Parent' },
];

// target_role = null nghĩa là gói dùng cho mọi role
export const getTargetRoleLabel = (targetRole) => {
  if (targetRole === 'TUTOR') {
    return 'Tutor';
  }
  if (targetRole === 'PARENT') {
    return 'Parent';
  }
  return 'All roles';
};

// Giới hạn số lớp: null = không giới hạn
export const getClassLimitLabel = (maxClassrooms) => {
  if (maxClassrooms === null || maxClassrooms === undefined) {
    return 'Unlimited';
  }
  return String(maxClassrooms);
};
