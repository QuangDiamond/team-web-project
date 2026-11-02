import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  CreditCard,
  History,
  LayoutDashboard,
  MessageSquare,
  Settings,
  TrendingUp,
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
