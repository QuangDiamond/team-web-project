import { Navigate, Outlet } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getHomePathByRole } from '../utils/getHomePathByRole';

// Chỉ cho người chưa đăng nhập vào các màn auth.
// Đã đăng nhập (kể cả ngay sau khi login thành công) thì chuyển tới trang theo role
export default function GuestRoute() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <div className="page-loading" role="status">
        <LoaderCircle size={28} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  if (user) {
    return <Navigate to={getHomePathByRole(user.role)} replace />;
  }

  return <Outlet />;
}
