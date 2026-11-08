import { Navigate, Outlet } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Chỉ cho user đã đăng nhập và có role nằm trong `roles` vào các route con.
// Chưa đăng nhập → /login, sai role → trang chủ. Backend vẫn tự kiểm tra quyền.
export default function RoleRoute({ roles }) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="page-loading" role="status">
        <LoaderCircle size={28} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
