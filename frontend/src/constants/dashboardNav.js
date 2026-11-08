import { LayoutDashboard, Tags, Users, Coins, Sparkles } from 'lucide-react';

// Menu sidebar theo role (Figma: nhóm NAV trong FeatureScreens.tsx).
// Mỗi nhóm có roles: chỉ hiện cho các role này.
export const DASHBOARD_NAV = [
  {
    label: 'GENERAL',
    roles: ['ADMIN', 'TUTOR', 'PARENT', 'STUDENT'],
    items: [
      { label: "Tổng quan", path: '/dashboard', Icon: LayoutDashboard },
    ],
  },
  {
    label: 'ADMIN',
    roles: ['ADMIN'],
    items: [
      { label: "Gói dịch vụ và giá", path: '/admin/plans', Icon: Tags },
      { label: "Người dùng", path: '/admin/users', Icon: Users },
    ],
  },
  {
    label: 'BILLING',
    roles: ['TUTOR', 'PARENT'],
    items: [
      { label: "Tín dụng và giao dịch", path: '/credits', Icon: Coins },
      { label: "Nâng cấp / Mua tín dụng", path: '/checkout', Icon: Sparkles },
    ],
  },
];

export const ROLE_LABELS = {
  ADMIN: "Quản trị viên",
  TUTOR: "Gia sư",
  PARENT: "Phụ huynh",
  STUDENT: "Học sinh",
};

// Các nhóm menu mà role này được thấy
export const getNavGroupsForRole = (role) => {
  return DASHBOARD_NAV.filter((group) => group.roles.includes(role));
};

// Tên các trang không có trong sidebar
const EXTRA_PAGE_LABELS = {
  '/payment/result': "Kết quả thanh toán",
};

// Tên trang hiện tại (hiện ở top bar), dựa vào đường dẫn
export const getNavLabelForPath = (pathname) => {
  if (EXTRA_PAGE_LABELS[pathname]) {
    return EXTRA_PAGE_LABELS[pathname];
  }
  if (pathname.startsWith('/receipts/')) {
    return "Biên nhận";
  }
  if (pathname.startsWith('/admin/users/')) {
    return "Chi tiết người dùng";
  }
  for (const group of DASHBOARD_NAV) {
    for (const item of group.items) {
      if (item.path === pathname) {
        return item.label;
      }
    }
  }
  return "Bảng điều khiển";
};

export const getRoleLabel = (role) => {
  const label = ROLE_LABELS[role];
  if (!label) {
    return role;
  }
  return label;
};
