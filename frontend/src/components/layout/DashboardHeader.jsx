import { Link } from 'react-router-dom';
import { Bell, Menu } from 'lucide-react';

// Header của DashboardLayout: nút mở sidebar (mobile), tiêu đề trang, các nút hành động theo role
export default function DashboardHeader({ title, actions = [], isSidebarOpen, onOpenSidebar }) {
  return (
    <header className="dashboard-header">
      <div className="dashboard-header-start">
        <button
          type="button"
          className="dashboard-icon-button dashboard-menu-button"
          aria-label="Open navigation"
          aria-controls="dashboard-sidebar"
          aria-expanded={isSidebarOpen}
          onClick={onOpenSidebar}
        >
          <Menu size={20} aria-hidden="true" />
        </button>
        <h1 className="dashboard-header-title">{title}</h1>
      </div>

      <div className="dashboard-header-actions">
        {/* Chưa có UC thông báo nên chỉ hiển thị, chưa bấm được */}
        <button type="button" className="dashboard-icon-button" aria-label="Notifications (coming soon)" title="Coming soon" disabled>
          <Bell size={20} aria-hidden="true" />
        </button>
        {actions.map((action) => (
          <Link key={action.label} to={action.to} className="dashboard-header-link">
            {action.label}
          </Link>
        ))}
      </div>
    </header>
  );
}
