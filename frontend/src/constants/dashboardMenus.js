import {
  Bell,
  BookOpen,
  Bookmark,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileText,
  History,
  LayoutDashboard,
  KeyRound,
  Mail,
  MessageSquare,
  Search,
  Send,
  Settings,
  ShieldAlert,
  TrendingUp,
  User,
  Users,
  Video,
} from 'lucide-react';

const createOverviewGroup = (role) => ({
  label: 'MENU CHÍNH',
  items: [{ label: 'Tổng quan', to: `/${role}/dashboard`, icon: LayoutDashboard, end: true }],
});

const createAccountGroup = (role, extraItems = []) => {
  let profilePath = '/profile';
  if (role === 'tutor') {
    profilePath = '/tutor/profile';
  }
  if (role === 'parent') {
    profilePath = (user) => {
      if (!user) return null;
      const userId = user.id || user._id;
      if (!userId) return null;
      return `/parents/${userId}`;
    };
  }
  const items = [];
  if (role !== 'admin') {
    items.push({ label: 'Hồ sơ của tôi', to: profilePath, icon: User });
  }
  return {
    label: 'TÀI KHOẢN',
    items: [
      ...items,
      { label: 'Đổi mật khẩu', to: `/${role}/change-password`, icon: KeyRound },
      ...extraItems,
    ],
  };
};

const createPaymentGroup = (role) => ({
  label: 'THANH TOÁN',
  items: [
    { label: 'Credits và giao dịch', to: `/${role}/credits`, icon: History },
    { label: 'Nâng cấp / Mua credits', to: `/${role}/checkout`, icon: CreditCard },
  ],
});

const createWorkItems = (role) => [
  { label: 'Lớp học', to: `/${role}/classes`, icon: BookOpen },
  { label: 'Tin nhắn', to: `/${role}/messages`, icon: MessageSquare },
  { label: 'Thỏa thuận', to: `/${role}/contracts`, icon: BookOpen },
  { label: 'Thông báo', to: `/${role}/notifications`, icon: Bell },
];

/*
 * Cấu hình menu cho DashboardLayout, mỗi role một export.
 * Cấu trúc (xem docs/architecture/dashboard-frame.md):
 * {
 *   roleLabel: 'Student',                 // badge dưới tên user ở sidebar
 *   groups: [
 *     { label: 'MAIN MENU', items: [
 *       { label: 'Overview', to: '/student/dashboard', icon: LayoutDashboard, end: true },
 *       { label: 'Classes', icon: BookOpen },   // không có `to` → hiển thị "Coming soon" (disabled)
 *     ] },
 *   ],
 *   headerActions: [{ label: 'Public Site', to: '/' }],   // tùy chọn: nút bên phải header
 *   footerAction: { label: 'Browse Jobs & Posts →', to: '/jobs' }, // tùy chọn: nút cuối sidebar
 * }
 * Mục "Log Out" luôn do DashboardLayout tự thêm, không khai báo ở đây.
 */

// UC36 – Student Dashboard. Menu theo Figma (StudentDashboard), mục chưa có màn hình để trống `to`
export const STUDENT_MENU = {
  roleLabel: "Học sinh",
  groups: [
    createOverviewGroup('student'),
    createAccountGroup('student', [
      { label: 'Giao dịch', icon: CreditCard },
      { label: 'Cài đặt', icon: Settings },
    ]),
    {
      label: "CÔNG VIỆC",
      items: [
        { label: "Lớp học", to: '/student/classes', icon: BookOpen },
        { label: "Buổi học của tôi", icon: Video },
        { label: "Tin nhắn", icon: MessageSquare },
        { label: "Thông báo", to: '/student/notifications', icon: Bell },
        { label: "Nhóm học tập", icon: Users },
      ],
    },
    {
      label: 'HỌC TẬP',
      items: [
        { label: "Lịch sử làm bài", icon: History },
        { label: "Bài tập", icon: ClipboardList },
        { label: "Hoạt động học tập", icon: TrendingUp },
        { label: "Lịch học", icon: CalendarDays },
      ],
    },
  ],
  headerActions: [{ label: "Trang chủ", to: '/' }],
};

// Parent workspace (menu theo Figma). Các mục chưa có `to` sẽ được thêm khi UC tương ứng hoàn thành.
// Đơn ứng tuyển xem trong chi tiết request; mục Gợi ý có dropdown chọn request ngay trên trang.
export const PARENT_MENU = {
  roleLabel: "Phụ huynh",
  groups: [
    createOverviewGroup('parent'),
    createAccountGroup('parent'),
    {
      label: 'TÌM CƠ HỘI',
      items: [
        { label: "Yêu cầu tìm gia sư", to: '/parent/requests', icon: FileText },
        { label: 'Gợi ý', to: '/parent/suggestions', icon: Users },
        { label: "Lời mời", to: '/parent/invitations', icon: Mail },
      ],
    },
    {
      label: 'CÔNG VIỆC',
      items: [
        ...createWorkItems('parent'),
        { label: 'Con và tiến độ học tập', icon: Users },
      ],
    },
    createPaymentGroup('parent'),
  ],
  headerActions: [{ label: "Trang chủ", to: '/' }],
};

// Tutor workspace: Overview, duyệt request (UC11), ứng tuyển (UC12), lời mời, hợp đồng, thông báo
export const TUTOR_MENU = {
  roleLabel: "Gia sư",
  groups: [
    createOverviewGroup('tutor'),
    createAccountGroup('tutor'),
    {
      label: "TÌM CƠ HỘI",
      items: [
        { label: "Tìm yêu cầu", to: '/tutor/requests', icon: Search, end: true },
        { label: 'Gợi ý', to: '/tutor/requests/suggested', icon: Search },
        { label: "Yêu cầu đã lưu", to: '/tutor/requests/saved', icon: Bookmark },
        { label: "Đơn ứng tuyển của tôi", to: '/tutor/applications', icon: Send },
        { label: "Lời mời", to: '/tutor/invitations', icon: Mail },
      ],
    },
    {
      label: "CÔNG VIỆC",
      items: [
        ...createWorkItems('tutor'),
        { label: "Bài đăng của tôi", to: '/tutor/posts', icon: FileText },
        { label: "Lịch của tôi", to: '/tutor/schedule', icon: CalendarDays },
      ],
    },
    createPaymentGroup('tutor'),
  ],
  headerActions: [{ label: "Trang chủ", to: '/' }],
};

// Admin workspace: UC40 Moderate Content & Reports, UC42 View System Statistics
export const ADMIN_MENU = {
  roleLabel: "Quản trị viên",
  groups: [
    createOverviewGroup('admin'),
    createAccountGroup('admin'),
    {
      label: "QUẢN TRỊ",
      items: [
        { label: "Người dùng", to: '/admin/users', icon: Users },
        { label: "Gói dịch vụ và giá", to: '/admin/plans', icon: CreditCard },
        { label: 'Danh mục', to: '/admin/categories', icon: BookOpen },
        { label: "Kiểm duyệt nội dung", to: '/admin/moderation', icon: ShieldAlert },
        { label: "Nhật ký kiểm duyệt", to: '/admin/audit-logs', icon: ClipboardList },
        { label: "Thông báo", to: '/admin/notifications', icon: Bell },
      ],
    },
  ],
  headerActions: [{ label: "Trang chủ", to: '/' }],
};
