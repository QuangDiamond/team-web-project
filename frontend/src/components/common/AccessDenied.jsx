import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

// Hiện khi user đã đăng nhập nhưng role không được vào trang (403)
export default function AccessDenied() {
  return (
    <div className="empty-state" role="alert">
      <ShieldAlert size={36} className="empty-state-icon" aria-hidden="true" />
      <h1 className="empty-state-title">Bạn không có quyền truy cập trang này</h1>
      <p className="empty-state-text">Trang này chỉ dành cho loại tài khoản khác. Nếu bạn cho rằng có nhầm lẫn, vui lòng liên hệ quản trị viên.</p>
      <Link to="/dashboard" className="btn btn-primary">Quay lại trang tổng quan</Link>
    </div>
  );
}
