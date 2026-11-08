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
  roleLabel: 'Student',
  groups: [
    {
      label: 'MAIN MENU',
      items: [
        { label: 'Overview', to: '/student/dashboard', icon: LayoutDashboard, end: true },
        { label: 'Classes', icon: BookOpen },
        { label: 'My Sessions', icon: Video },
        { label: 'Messages', icon: MessageSquare },
        { label: 'Notifications', to: '/student/notifications', icon: Bell },
        { label: 'Study Groups', icon: Users },
      ],
    },
    {
      label: 'LEARNING',
      items: [
        { label: 'Quiz History', icon: History },
        { label: 'Assignments', icon: ClipboardList },
        { label: 'Learning Activity', icon: TrendingUp },
        { label: 'Schedule', icon: CalendarDays },
      ],
    },
    {
      label: 'ACCOUNT',
      items: [
        { label: 'Transactions', icon: CreditCard },
        { label: 'Settings', icon: Settings },
      ],
    },
  ],
  headerActions: [{ label: 'Public Site', to: '/' }],
};

// Parent workspace (menu theo Figma). Các mục chưa có `to` sẽ được thêm khi UC tương ứng hoàn thành.
// Đơn ứng tuyển xem ngay trong chi tiết request (Tutoring Requests); "AI Suggestions" có dropdown chọn request ngay trên trang
export const PARENT_MENU = {
  roleLabel: 'Parent',
  groups: [
    {
      label: 'PARENT',
      items: [
        { label: 'Overview', to: '/parent/dashboard', icon: LayoutDashboard, end: true },
        { label: 'Tutoring Requests', to: '/parent/requests', icon: FileText },
        { label: 'AI Suggestions', to: '/parent/ai-suggestions', icon: Sparkles },
        { label: 'Invitations', to: '/parent/invitations', icon: Mail },
        { label: 'Messages', to: '/parent/messages', icon: MessageSquare },
        { label: 'Contracts', to: '/parent/contracts', icon: BookOpen },
        { label: 'Notifications', to: '/parent/notifications', icon: Bell },
        { label: 'Children & Progress', icon: Users },
      ],
    },
    {
      label: 'PAYMENTS',
      items: [
        { label: 'Credits & Transactions', to: '/parent/credits', icon: History },
        { label: 'Upgrade / Buy Credits', to: '/parent/checkout', icon: CreditCard },
      ],
    },
  ],
  headerActions: [{ label: 'Public Site', to: '/' }],
};

// Tutor workspace: Overview, duyệt request (UC11), ứng tuyển (UC12), lời mời, hợp đồng, thông báo
export const TUTOR_MENU = {
  roleLabel: 'Tutor',
  groups: [
    {
      label: 'MAIN MENU',
      items: [{ label: 'Overview', to: '/tutor/dashboard', icon: LayoutDashboard, end: true }],
    },
    {
      label: 'FIND WORK',
      items: [
        { label: 'Browse Requests', to: '/tutor/requests', icon: Search, end: true },
        { label: 'Suggested for You', to: '/tutor/requests/suggested', icon: Sparkles },
        { label: 'Saved Requests', to: '/tutor/requests/saved', icon: Bookmark },
        { label: 'My Applications', to: '/tutor/applications', icon: Send },
        { label: 'Invitations', to: '/tutor/invitations', icon: Mail },
      ],
    },
    {
      label: 'MY WORK',
      items: [
        { label: 'Messages', to: '/tutor/messages', icon: MessageSquare },
        { label: 'Contracts', to: '/tutor/contracts', icon: BookOpen },
        { label: 'Notifications', to: '/tutor/notifications', icon: Bell },
        { label: 'My Profile', to: '/tutor/profile', icon: User },
        { label: 'My Posts', to: '/tutor/posts', icon: FileText },
      ],
    },
    {
      label: 'PAYMENTS',
      items: [
        { label: 'Credits & Transactions', to: '/tutor/credits', icon: History },
        { label: 'Upgrade / Buy Credits', to: '/tutor/checkout', icon: CreditCard },
      ],
    },
  ],
  headerActions: [{ label: 'Public Site', to: '/' }],
};

// Admin workspace: UC40 Moderate Content & Reports, UC42 View System Statistics
export const ADMIN_MENU = {
  roleLabel: 'Admin',
  groups: [
    {
      label: 'ADMINISTRATION',
      items: [
        { label: 'System Statistics', to: '/admin/dashboard', icon: LayoutDashboard, end: true },
        { label: 'Users', to: '/admin/users', icon: Users },
        { label: 'Plans & Pricing', to: '/admin/plans', icon: CreditCard },
        { label: 'Content Moderation', to: '/admin/moderation', icon: ShieldAlert },
        { label: 'Notifications', to: '/admin/notifications', icon: Bell },
      ],
    },
  ],
  headerActions: [{ label: 'Public Site', to: '/' }],
};
