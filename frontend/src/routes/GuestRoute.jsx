import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getPathAfterLogin } from './redirectAfterLogin';

// Chỉ cho người chưa đăng nhập vào các màn auth; đã đăng nhập thì về dashboard (hoặc trang đang mở dở)
export default function GuestRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="page-loading" role="status">
        <LoaderCircle size={28} className="spin" aria-hidden="true" />
        <span className="visually-hidden">Loading...</span>
      </div>
    );
  }

  if (user) {
    return <Navigate to={getPathAfterLogin(location)} replace />;
  }

  return <Outlet />;
}
