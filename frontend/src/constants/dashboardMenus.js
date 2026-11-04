import {
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
  Sparkles,
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

// Parent workspace (menu theo Figma). Các mục chưa có `to` sẽ được thêm khi UC tương ứng hoàn thành.
// "Applications" và "AI Suggestions" cần một request cụ thể nên mở trang chọn request (RequestPicker)
export const PARENT_MENU = {
  roleLabel: 'Parent',
  groups: [
    {
      label: 'PARENT',
      items: [
        { label: 'Overview', to: '/parent/dashboard', icon: LayoutDashboard, end: true },
        { label: 'Tutoring Requests', to: '/parent/requests', icon: FileText },
        { label: 'Applications', to: '/parent/applications', icon: ClipboardList },
        { label: 'AI Suggestions', to: '/parent/ai-suggestions', icon: Sparkles },
        { label: 'Invitations', to: '/parent/invitations', icon: Mail },
        { label: 'Contracts', icon: BookOpen },
        { label: 'Children & Progress', icon: Users },
      ],
    },
  ],
  headerActions: [{ label: 'Public Site', to: '/' }],
};

// Tutor workspace: Overview, duyệt request (UC11), ứng tuyển (UC12), lời mời
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
  ],
  headerActions: [{ label: 'Public Site', to: '/' }],
};
