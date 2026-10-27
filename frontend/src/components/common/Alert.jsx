import { CircleAlert, CircleCheck, Info } from 'lucide-react';

const ICONS = {
  error: CircleAlert,
  success: CircleCheck,
  info: Info,
};

// Thông báo dạng hộp: type = 'error' | 'success' | 'info'
export default function Alert({ type = 'info', children }) {
  const Icon = ICONS[type];
  // Lỗi cần được đọc ngay (alert), thông báo thường thì lịch sự hơn (status)
  const role = type === 'error' ? 'alert' : 'status';

  return (
    <div className={`alert alert-${type}`} role={role}>
      <Icon size={18} className="alert-icon" aria-hidden="true" />
      <div className="alert-content">{children}</div>
    </div>
  );
}
