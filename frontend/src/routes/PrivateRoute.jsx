import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AccessDenied from '../components/common/AccessDenied';

// Chỉ cho người đã đăng nhập vào; roles (không bắt buộc) giới hạn thêm theo role, vd: ['ADMIN']
export default function PrivateRoute({ roles }) {
  const { user, initializing, loggedOutByUser, accountLockedOnStart } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="page-loading" role="status">
        <LoaderCircle size={28} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Đang tải...</span>
      </div>
    );
  }

  if (!user) {
    // Tự bấm Log out (D2-B1) hoặc tài khoản bị khóa (UC37-B4) thì không nhớ trang cũ:
    // người đăng nhập tiếp theo trên tab này về /dashboard
    if (loggedOutByUser || accountLockedOnStart) {
      return <Navigate to="/login" replace />;
    }
    // Nhớ trang đang mở để đăng nhập xong quay lại (D2)
    const fromPath = location.pathname + location.search;
    return <Navigate to="/login" replace state={{ from: fromPath }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <AccessDenied />;
  }

  return <Outlet />;
}
