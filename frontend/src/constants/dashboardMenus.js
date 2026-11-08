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
  Sparkles,
  TrendingUp,
  User,
  Users,
  Video,
} from 'lucide-react';

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
    {
      label: "MENU CHÍNH",
      items: [
        { label: "Tổng quan", to: '/student/dashboard', icon: LayoutDashboard, end: true },
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
    {
      label: "TÀI KHOẢN",
      items: [
        { label: "Giao dịch", icon: CreditCard },
        { label: "Đổi mật khẩu", to: '/student/change-password', icon: KeyRound },
        { label: "Cài đặt", icon: Settings },
      ],
    },
  ],
  headerActions: [{ label: "Trang chủ", to: '/' }],
};

// Parent workspace (menu theo Figma). Các mục chưa có `to` sẽ được thêm khi UC tương ứng hoàn thành.
// "Applications" và "AI Suggestions" cần một request cụ thể nên mở trang chọn request (RequestPicker)
export const PARENT_MENU = {
  roleLabel: "Phụ huynh",
  groups: [
    {
      label: 'PHỤ HUYNH',
      items: [
        { label: "Tổng quan", to: '/parent/dashboard', icon: LayoutDashboard, end: true },
        { label: "Lớp học", to: '/parent/classes', icon: BookOpen },
        { label: "Yêu cầu tìm gia sư", to: '/parent/requests', icon: FileText },
        { label: "Đơn ứng tuyển", to: '/parent/applications', icon: ClipboardList },
        { label: "Gợi ý AI", to: '/parent/ai-suggestions', icon: Sparkles },
        { label: "Lời mời", to: '/parent/invitations', icon: Mail },
        { label: "Tin nhắn", to: '/parent/messages', icon: MessageSquare },
        { label: "Thỏa thuận", to: '/parent/contracts', icon: BookOpen },
        { label: "Thông báo", to: '/parent/notifications', icon: Bell },
        { label: "Con và tiến độ học tập", icon: Users },
      ],
    },
    {
      label: "THANH TOÁN",
      items: [
        { label: "Tín dụng và giao dịch", to: '/parent/credits', icon: History },
        { label: "Nâng cấp / Mua tín dụng", to: '/parent/checkout', icon: CreditCard },
      ],
    },
    { label: "TÀI KHOẢN", items: [{ label: "Đổi mật khẩu", to: '/parent/change-password', icon: KeyRound }] },
  ],
  headerActions: [{ label: "Trang chủ", to: '/' }],
};

// Tutor workspace: Overview, duyệt request (UC11), ứng tuyển (UC12), lời mời, hợp đồng, thông báo
export const TUTOR_MENU = {
  roleLabel: "Gia sư",
  groups: [
    {
      label: "MENU CHÍNH",
      items: [{ label: "Tổng quan", to: '/tutor/dashboard', icon: LayoutDashboard, end: true }],
    },
    {
      label: "TÌM CƠ HỘI",
      items: [
        { label: "Tìm yêu cầu", to: '/tutor/requests', icon: Search, end: true },
        { label: "Gợi ý dành cho bạn", to: '/tutor/requests/suggested', icon: Sparkles },
        { label: "Yêu cầu đã lưu", to: '/tutor/requests/saved', icon: Bookmark },
        { label: "Đơn ứng tuyển của tôi", to: '/tutor/applications', icon: Send },
        { label: "Lời mời", to: '/tutor/invitations', icon: Mail },
      ],
    },
    {
      label: "CÔNG VIỆC",
      items: [
        { label: "Lớp học", to: '/tutor/classes', icon: BookOpen },
        { label: "Tin nhắn", to: '/tutor/messages', icon: MessageSquare },
        { label: "Thỏa thuận", to: '/tutor/contracts', icon: BookOpen },
        { label: "Thông báo", to: '/tutor/notifications', icon: Bell },
        { label: "Hồ sơ của tôi", to: '/tutor/profile', icon: User },
        { label: "Bài đăng của tôi", to: '/tutor/posts', icon: FileText },
      ],
    },
    {
      label: "THANH TOÁN",
      items: [
        { label: "Tín dụng và giao dịch", to: '/tutor/credits', icon: History },
        { label: "Nâng cấp / Mua tín dụng", to: '/tutor/checkout', icon: CreditCard },
      ],
    },
    { label: "TÀI KHOẢN", items: [{ label: "Đổi mật khẩu", to: '/tutor/change-password', icon: KeyRound }] },
  ],
  headerActions: [{ label: "Trang chủ", to: '/' }],
};

// Admin workspace: UC40 Moderate Content & Reports, UC42 View System Statistics
export const ADMIN_MENU = {
  roleLabel: "Quản trị viên",
  groups: [
    {
      label: "QUẢN TRỊ",
      items: [
        { label: "Thống kê hệ thống", to: '/admin/dashboard', icon: LayoutDashboard, end: true },
        { label: "Người dùng", to: '/admin/users', icon: Users },
        { label: "Gói dịch vụ và giá", to: '/admin/plans', icon: CreditCard },
        { label: "Kiểm duyệt nội dung", to: '/admin/moderation', icon: ShieldAlert },
        { label: "Thông báo", to: '/admin/notifications', icon: Bell },
      ],
    },
    { label: "TÀI KHOẢN", items: [{ label: "Đổi mật khẩu", to: '/admin/change-password', icon: KeyRound }] },
  ],
  headerActions: [{ label: "Trang chủ", to: '/' }],
};
