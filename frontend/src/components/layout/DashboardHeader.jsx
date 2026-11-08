import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getUnreadCount } from '../../services/notificationService';

// Header của DashboardLayout: nút mở sidebar (mobile), tiêu đề trang, chuông thông báo (UC33/UC35), các nút hành động theo role
export default function DashboardHeader({ title, actions = [], isSidebarOpen, onOpenSidebar }) {
  const { user } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  let notificationsPath = '/student/notifications';
  if (user && user.role) {
    notificationsPath = `/${user.role.toLowerCase()}/notifications`;
  }

  useEffect(() => {
    if (!user) {
      return;
    }
    const fetchUnread = () => {
      getUnreadCount()
        .then((res) => {
          const count = res?.data?.unreadCount ?? res?.unreadCount;
          if (typeof count === 'number') {
            setUnreadCount(count);
          }
        })
        .catch(() => {});
    };

    fetchUnread();
    const timer = setInterval(fetchUnread, 5000);
    return () => clearInterval(timer);
  }, [user, location.pathname]);

  return (
    <header className="dashboard-header">
      <div className="dashboard-header-start">
        <button
          type="button"
          className="dashboard-icon-button dashboard-menu-button"
          aria-label="Mở menu điều hướng"
          aria-controls="dashboard-sidebar"
          aria-expanded={isSidebarOpen}
          onClick={onOpenSidebar}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <h1 className="dashboard-header-title">{title}</h1>
      </div>

      <div className="dashboard-header-actions">
        <Link
          to={notificationsPath}
          className="dashboard-icon-button"
          aria-label="Thông báo"
          title="Thông báo"
          style={{ position: 'relative' }}
        >
          <Bell size={20} aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="nav-noti-badge">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>
        {actions.map((action) => (
          <Link key={action.label} to={action.to} className="dashboard-header-link">
            {action.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
