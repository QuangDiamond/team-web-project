import { Link } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import NotificationBell from '../common/NotificationBell';

// Header của DashboardLayout: nút mở sidebar (mobile), tiêu đề trang, chuông thông báo (UC33/UC35), các nút hành động theo role
export default function DashboardHeader({ title, actions = [], isSidebarOpen, onOpenSidebar }) {
  const { user } = useAuth();
  let notificationsPath = '/student/notifications';
  if (user && user.role) {
    notificationsPath = `/${user.role.toLowerCase()}/notifications`;
  }

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
        {user && (
          <NotificationBell notificationsPath={notificationsPath} buttonClassName="dashboard-icon-button" />
        )}
        {actions.map((action) => (
          <Link key={action.label} to={action.to} className="dashboard-header-link">
            {action.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
