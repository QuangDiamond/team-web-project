import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getNavGroupsForRole, getNavLabelForPath, getRoleLabel } from '../../constants/dashboardNav';

// Lấy chữ cái đầu của tối đa 2 từ trong tên, vd: "Lai Huu" -> "LH"
const getInitials = (fullName) => {
  if (!fullName) {
    return 'U';
  }
  const words = fullName.trim().split(/\s+/).slice(0, 2);
  const letters = words.map((word) => word.charAt(0).toUpperCase());
  return letters.join('');
};

const getNavLinkClass = ({ isActive }) => {
  if (isActive) {
    return 'sidebar-link is-active';
  }
  return 'sidebar-link';
};

// Bố cục khu vực đã đăng nhập: sidebar (menu theo role) + top bar + nội dung trang.
// Dưới 900px sidebar thành ngăn kéo (drawer) mở bằng nút menu trên top bar.
export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Esc để đóng drawer
  useEffect(() => {
    if (!drawerOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setDrawerOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [drawerOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const navGroups = getNavGroupsForRole(user.role);
  const pageLabel = getNavLabelForPath(location.pathname);

  let sidebarClass = 'sidebar';
  if (drawerOpen) {
    sidebarClass = 'sidebar is-open';
  }

  return (
    <div className="dashboard-layout">
      {drawerOpen && (
        <button type="button" className="sidebar-backdrop" aria-label="Close navigation" onClick={closeDrawer} />
      )}

      <aside id="dashboard-sidebar" className={sidebarClass} aria-label="Main navigation">
        <div className="sidebar-brand">
          <Link to="/" className="brand-logo sidebar-brand-link">
            <span className="brand-logo-mark" aria-hidden="true">Tu</span>
            <span className="brand-logo-text">TuConnector</span>
          </Link>
          <button type="button" className="icon-button sidebar-close" aria-label="Close navigation" onClick={closeDrawer}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="sidebar-user">
          <span className="avatar" aria-hidden="true">{getInitials(user.full_name)}</span>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user.full_name}</p>
            <span className="badge badge-orange">{getRoleLabel(user.role)}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.label} className="sidebar-group">
              <p className="sidebar-group-label">{group.label}</p>
              <ul className="sidebar-list">
                {group.items.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <li key={item.path}>
                      {/* Chỉ Overview cần khớp tuyệt đối; mục khác vẫn sáng ở trang con, vd /admin/users/:id */}
                      <NavLink to={item.path} end={item.path === '/dashboard'} className={getNavLinkClass} onClick={closeDrawer}>
                        <Icon size={18} aria-hidden="true" />
                        <span>{item.label}</span>
                      </NavLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="btn btn-outline btn-block btn-sm" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="icon-button topbar-menu"
              aria-label="Open navigation"
              aria-controls="dashboard-sidebar"
              aria-expanded={drawerOpen ? 'true' : 'false'}
              onClick={() => setDrawerOpen(true)}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
            <span className="topbar-title">{pageLabel}</span>
          </div>
          <div className="topbar-right">
            <span className="topbar-user">{user.full_name}</span>
            <span className="avatar avatar-sm" aria-hidden="true">{getInitials(user.full_name)}</span>
          </div>
        </header>

        <main className="dashboard-content">
          <div className="dashboard-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
