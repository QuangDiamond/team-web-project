import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'TUTOR':
        return {
          label: '👨‍🏫 Gia sư (Tutor)',
          bg: '#fff7ed',
          color: '#c2410c',
          border: '#fed7aa',
        };
      case 'STUDENT':
        return {
          label: '🎒 Học sinh (Student)',
          bg: '#f0fdf4',
          color: '#15803d',
          border: '#bbf7d0',
        };
      case 'PARENT':
        return {
          label: '👨‍👩‍👧 Phụ huynh (Parent)',
          bg: '#faf5ff',
          color: '#7e22ce',
          border: '#e9d5ff',
        };
      case 'ADMIN':
        return {
          label: '🛡️ Quản trị viên (Admin)',
          bg: '#fef2f2',
          color: '#b91c1c',
          border: '#fecaca',
        };
      default:
        return {
          label: role || 'Thành viên',
          bg: '#f8fafc',
          color: '#475569',
          border: '#cbd5e1',
        };
    }
  };

  return (
    <div className="layout">
      <header className="header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 28px', background: '#ffffff', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none', color: '#0f172a', fontWeight: 'bold', fontSize: '18px' }}>
            <span style={{ background: '#e85a2c', color: '#fff', padding: '3px 8px', borderRadius: '6px', fontSize: '14px' }}>Tu</span>
            TuConnector
          </Link>
          <Link to="/classes" style={{ textDecoration: 'none', color: '#e85a2c', fontWeight: 600, fontSize: '15px' }}>
            🏫 Classes
          </Link>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px', color: '#64748b' }}>
                  Xin chào, <strong>{user.full_name || user.email || 'Người dùng'}</strong>
                </span>
                {(() => {
                  const badge = getRoleBadge(user.role);
                  return (
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        padding: '3px 9px',
                        borderRadius: '16px',
                        background: badge.bg,
                        color: badge.color,
                        border: `1px solid ${badge.border}`,
                        display: 'inline-flex',
                        alignItems: 'center',
                      }}
                      title={`Tài khoản hiện tại có vai trò: ${user.role}`}
                    >
                      {badge.label}
                    </span>
                  );
                })()}
              </div>
              <button onClick={handleLogout} style={{ border: '1px solid #cbd5e1', background: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}>Đăng xuất</button>
            </div>
          ) : (
            <>
              <Link to="/login" style={{ textDecoration: 'none', color: '#475569', fontSize: '14px', fontWeight: 500 }}>Sign In</Link>
              <Link to="/register" style={{ textDecoration: 'none', background: '#e85a2c', color: '#fff', padding: '6px 14px', borderRadius: '8px', fontSize: '14px', fontWeight: 600 }}>Get Started</Link>
            </>
          )}
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>&copy; 2026 Team Web Project</p>
      </footer>
    </div>
  );
}