import { useEffect, useState } from 'react';
import { Outlet, useMatches } from 'react-router-dom';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import DashboardHeader from '../components/layout/DashboardHeader';

// Tiêu đề header lấy từ `handle.title` của route sâu nhất có khai báo
const getPageTitle = (matches) => {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const handle = matches[index].handle;
    if (handle && handle.title) {
      return handle.title;
    }
  }
  return 'Dashboard';
};

/*
 * Khung dashboard dùng chung cho mọi role (Student, Tutor, Parent, Admin).
 * menu: cấu hình trong src/constants/dashboardMenus.js
 * Cách dùng: docs/architecture/dashboard-frame.md
 */
export default function DashboardLayout({ menu }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const matches = useMatches();
  const title = getPageTitle(matches);

  const openSidebar = () => {
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Mobile: bấm Esc để đóng sidebar
  useEffect(() => {
    if (!isSidebarOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSidebarOpen]);

  return (
    <div className="dashboard-layout">
      {isSidebarOpen && <div className="dashboard-overlay" aria-hidden="true" onClick={closeSidebar} />}

      <DashboardSidebar menu={menu} isOpen={isSidebarOpen} onClose={closeSidebar} />

      <div className="dashboard-body">
        <DashboardHeader
          title={title}
          actions={menu.headerActions}
          isSidebarOpen={isSidebarOpen}
          onOpenSidebar={openSidebar}
        />
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
