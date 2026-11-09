import { Bell, BookOpen, CalendarDays, CreditCard, FileText, Handshake, Mail, Megaphone } from 'lucide-react';
export const NOTIFICATION_CATEGORIES = [{
  key: 'ALL',
  label: 'Tất cả',
  Icon: Megaphone
}, {
  key: 'APPLICATION',
  label: 'Ứng tuyển',
  Icon: FileText
}, {
  key: 'INVITATION',
  label: 'Lời mời',
  Icon: Mail
}, {
  key: 'CONVERSATION',
  label: 'Kết nối và thỏa thuận',
  Icon: Handshake
}, {
  key: 'SESSION',
  label: 'Buổi học',
  Icon: CalendarDays
}, {
  key: 'ASSIGNMENT',
  label: 'Bài tập và điểm số',
  Icon: BookOpen
}, {
  key: 'SYSTEM',
  label: 'Hệ thống và ví',
  Icon: CreditCard
}];
export const getNotificationCategory = key => NOTIFICATION_CATEGORIES.find(item => item.key === key) || {
  label: 'Thông báo',
  Icon: Bell
};
export const getRelativeTime = value => {
  if (!value) {
    return 'Gần đây';
  }
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (!Number.isFinite(seconds)) {
    return 'Gần đây';
  }
  if (seconds < 60) {
    return 'Vừa xong';
  }
  if (seconds < 3600) {
    return `${Math.floor(seconds / 60)} phút trước`;
  }
  if (seconds < 86400) {
    return `${Math.floor(seconds / 3600)} giờ trước`;
  }
  return `${Math.floor(seconds / 86400)} ngày trước`;
};
