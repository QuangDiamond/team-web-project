import { Navigate, Outlet } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Chỉ cho người chưa đăng nhập vào các màn auth; đã đăng nhập thì về trang chủ
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
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
