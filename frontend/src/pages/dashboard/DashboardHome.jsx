import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getNavGroupsForRole } from '../../constants/dashboardNav';
import PageHeader from '../../components/common/PageHeader';

// Trang tổng quan tạm thời: lời chào + lối tắt tới các màn theo role
export default function DashboardHome() {
  const { user } = useAuth();

  const shortcuts = [];
  getNavGroupsForRole(user.role).forEach((group) => {
    group.items.forEach((item) => {
      if (item.path !== '/dashboard') {
        shortcuts.push(item);
      }
    });
  });

  return (
    <>
      <PageHeader
        eyebrow="TỔNG QUAN"
        title={`Chào mừng trở lại, ${user.full_name}`}
        description="Truy cập nhanh các chức năng thường dùng."
      />
      <ul className="shortcut-grid">
        {shortcuts.map((item) => {
          const Icon = item.Icon;
          return (
            <li key={item.path}>
              <Link to={item.path} className="card shortcut-card">
                <span className="shortcut-icon" aria-hidden="true"><Icon size={20} /></span>
                <span className="shortcut-label">{item.label}</span>
                <ChevronRight size={18} className="shortcut-arrow" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
