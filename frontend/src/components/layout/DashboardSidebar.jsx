import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

// Lấy tối đa 2 chữ cái đầu của tên để làm avatar
const getInitials = (fullName) => {
  if (!fullName) {
    return 'U';
  }
  const words = fullName.trim().split(/\s+/);
  const initials = words.map((word) => word[0]).join('');
  return initials.slice(0, 2).toUpperCase();
};

const getNavLinkClass = ({ isActive }) => {
  if (isActive) {
    return 'dashboard-nav-link is-active';
  }
  return 'dashboard-nav-link';
};

function NavItem({ item, user, onNavigate }) {
  const Icon = item.icon;
  let destination = item.to;
  if (typeof destination === 'function') {
    destination = destination(user);
  }

  // Mục chưa có màn hình: hiển thị nhưng không bấm được
  if (!destination) {
    return (
      <li>
        <span className="dashboard-nav-link is-disabled" aria-disabled="true" title="Sắp ra mắt">
          {Icon && <Icon size={16} aria-hidden="true" />}
          <span>{item.label}</span>
        </span>
      </li>
    );
  }

  return (
    <li>
      <NavLink to={destination} end={item.end === true} className={getNavLinkClass} onClick={onNavigate}>
        {Icon && <Icon size={16} aria-hidden="true" />}
        <span>{item.label}</span>
      </NavLink>
    </li>
  );
}

// Sidebar của DashboardLayout: logo, thẻ user, các nhóm menu theo role, Log Out
export default function DashboardSidebar({ menu, isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  let fullName = '';
  if (user && user.full_name) {
    fullName = user.full_name;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  let sidebarClass = 'dashboard-sidebar';
  if (isOpen) {
    sidebarClass = 'dashboard-sidebar is-open';
  }

  return (
    <aside id="dashboard-sidebar" className={sidebarClass} aria-label="Điều hướng bảng điều khiển">
      <div className="dashboard-sidebar-brand">
        <Link to="/" className="brand-logo">
          <span className="brand-logo-mark" aria-hidden="true">Tu</span>
          <span className="brand-logo-text">TuConnector</span>
        </Link>
      </div>

      <div className="dashboard-user-card">
        <span className="dashboard-avatar" aria-hidden="true">{user?.avatar_url ? <img src={user.avatar_url} alt="" /> : getInitials(fullName)}</span>
        <div className="dashboard-user-info">
          <p className="dashboard-user-name">{fullName || "Người dùng"}</p>
          <span className="dashboard-role-badge">{menu.roleLabel}</span>
        </div>
      </div>

      <nav className="dashboard-nav">
        {menu.groups.map((group) => (
          <div key={group.label} className="dashboard-nav-group">
            <p className="dashboard-nav-group-label">{group.label}</p>
            <ul className="dashboard-nav-list">
              {group.items.map((item) => (
                <NavItem key={item.label} item={item} user={user} onNavigate={onClose} />
              ))}
            </ul>
          </div>
        ))}

        <div className="dashboard-nav-group">
          <button type="button" className="dashboard-nav-link is-danger" onClick={handleLogout}>
            <LogOut size={16} aria-hidden="true" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </nav>

      {menu.footerAction && (
        <div className="dashboard-sidebar-footer">
          <Link to={menu.footerAction.to} className="dashboard-sidebar-footer-link" onClick={onClose}>
            {menu.footerAction.label}
          </Link>
        </div>
      )}
    </aside>
  );
}
