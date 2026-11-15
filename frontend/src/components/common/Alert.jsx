import { useEffect, useState } from 'react';
import { CircleAlert, CircleCheck, Info } from 'lucide-react';

const ICONS = {
  error: CircleAlert,
  success: CircleCheck,
  info: Info,
};

// Thông báo thành công tự ẩn sau số giây này
const SUCCESS_AUTO_HIDE_SECONDS = 10;

// Thông báo dạng hộp: type = 'error' | 'success' | 'info'
export default function Alert({ type = 'info', children }) {
  const isSuccess = type === 'success';
  const [secondsLeft, setSecondsLeft] = useState(SUCCESS_AUTO_HIDE_SECONDS);

  useEffect(() => {
    if (!isSuccess || secondsLeft <= 0) {
      return undefined;
    }
    const timerId = setTimeout(() => setSecondsLeft(secondsLeft - 1), 1000);
    return () => clearTimeout(timerId);
  }, [isSuccess, secondsLeft]);

  if (isSuccess && secondsLeft <= 0) {
    return null;
  }

  const Icon = ICONS[type];
  // Lỗi cần được đọc ngay (alert), thông báo thường thì lịch sự hơn (status)
  const role = type === 'error' ? 'alert' : 'status';

  return (
    <div className={`alert alert-${type}`} role={role}>
      <Icon size={18} className="alert-icon" aria-hidden="true" />
      <div className="alert-content">{children}</div>
      {isSuccess && (
        <span className="alert-countdown" aria-hidden="true">{secondsLeft}s</span>
      )}
    </div>
  );
}
