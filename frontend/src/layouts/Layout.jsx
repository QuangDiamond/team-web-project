import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getHomePathByRole } from '../utils/getHomePathByRole';
import { getUnreadCount } from '../services/notificationService';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  let dashboardPath = '/login';
  let notificationsPath = '/login';
  if (user && user.role) {
    dashboardPath = getHomePathByRole(user.role);
    notificationsPath = `/${user.role.toLowerCase()}/notifications`;
  }

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    getUnreadCount()
      .then((res) => {
        if (res && res.data && typeof res.data.unreadCount === 'number') {
          setUnreadCount(res.data.unreadCount);
        }
      })
      .catch(() => {});
  }, [user, location.pathname]);

  const handleLogout = async () => {
    await logout();
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
    <div className="app-layout">
      <nav className="site-navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">
            <div className="brand-icon">Tu</div>
            <span>TuConnector</span>
          </Link>

          <div className="nav-links">
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Trang chủ
            </Link>
            <Link
              to="/classes"
              className={`nav-link ${location.pathname.startsWith('/classes') ? 'active' : ''}`}
              style={{ fontWeight: 600, color: '#e85a2c' }}
            >
              🏫 Lớp học
            </Link>
            <a href="/#features" className="nav-link">
              Tính năng
            </a>
            <a href="/#featured-tutors" className="nav-link">
              Gia sư tiêu biểu
            </a>
            <a href="/#how-it-works" className="nav-link">
              Cách hoạt động
            </a>
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                <Link
                  to={notificationsPath}
                  className="nav-noti-btn"
                  title="Thông báo hệ thống"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="nav-noti-badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
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
                <Link to={dashboardPath} className="btn btn-primary">
                  Dashboard
                </Link>
                <Link to="/profile" className="btn btn-outline">
                  {user.full_name || user.email || 'Tài khoản'}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-ghost"
                  style={{ color: '#EF4444' }}
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Đăng ký ngay
                </Link>
              </>
            )}

            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mobile-nav-drawer open">
            <div>
              <div className="mobile-nav-section-title">Điều hướng</div>
              <div className="mobile-nav-group">
                <Link
                  to="/"
                  className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Trang chủ</span>
                </Link>
                <Link
                  to="/classes"
                  className={`mobile-nav-item ${location.pathname.startsWith('/classes') ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>🏫 Lớp học</span>
                </Link>
                <a
                  href="/#features"
                  className="mobile-nav-item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Tính năng</span>
                </a>
                <a
                  href="/#featured-tutors"
                  className="mobile-nav-item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Gia sư tiêu biểu</span>
                </a>
                <a
                  href="/#how-it-works"
                  className="mobile-nav-item"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Cách hoạt động</span>
                </a>
              </div>
            </div>

            <div
              style={{
                borderTop: '1px solid var(--gray-100)',
                paddingTop: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              {user ? (
                <>
                  <Link
                    to={dashboardPath}
                    className="btn btn-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Vào Dashboard ({user.role})
                  </Link>
                  <Link
                    to="/classes"
                    className="btn btn-outline"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    🏫 Lớp học của tôi
                  </Link>
                  <Link
                    to={notificationsPath}
                    className="btn btn-outline"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Thông báo ({unreadCount})
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="btn btn-ghost"
                    style={{ color: '#EF4444' }}
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn btn-outline"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Đăng ký ngay
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
      <main className="main-content">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="nav-brand">
                <div className="brand-icon">Tu</div>
                <span>TuConnector</span>
              </Link>
              <p>
                Nền tảng kết nối gia sư và phụ huynh thông minh hàng đầu Việt Nam.
                Ứng dụng AI ghép đôi chính xác và quản lý lịch dạy hiệu quả.
              </p>
            </div>

            <div className="footer-col">
              <h4>Khám phá</h4>
              <ul>
                <li><Link to="/">Trang chủ</Link></li>
                <li><a href="/#features">Tính năng nổi bật</a></li>
                <li><a href="/#featured-tutors">Gia sư tiêu biểu</a></li>
                <li><a href="/#how-it-works">Quy trình kết nối</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Dành cho người dùng</h4>
              <ul>
                <li><Link to={user ? dashboardPath : '/login'}>Bảng điều khiển (Dashboard)</Link></li>
                <li><Link to="/register">Đăng ký Phụ huynh / Gia sư</Link></li>
                <li><Link to="/payment">Gói dịch vụ &amp; Credits</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Hỗ trợ</h4>
              <ul>
                <li><a href="/#how-it-works">Hướng dẫn sử dụng</a></li>
                <li><Link to="/login">Đăng nhập tài khoản</Link></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} TuConnector. All rights reserved.</p>
            <div className="footer-bottom-links">
              <Link to="/">Trang chủ</Link>
              <Link to="/login">Đăng nhập</Link>
              <Link to="/register">Đăng ký</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
