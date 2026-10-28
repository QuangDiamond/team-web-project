import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { notificationService } from '../services/notificationService';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(3);

  useEffect(() => {
    notificationService
      .getNotifications()
      .then((res) => {
        if (res && res.unreadCount !== undefined) {
          setUnreadCount(res.unreadCount);
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isTeachingActive =
    ['/connections', '/contracts', '/applications', '/invitations'].some((p) =>
      location.pathname.startsWith(p)
    );

  const isAdminActive =
    ['/admin/moderation', '/moderation', '/admin/dashboard', '/dashboard'].some((p) =>
      location.pathname.startsWith(p)
    );

  return (
    <div className="app-layout">
      {/* Site Navbar */}
      <nav className="site-navbar">
        <div className="nav-container">
          {/* Brand Logo */}
          <Link to="/" className="nav-brand">
            <div className="brand-icon">Tu</div>
            <span>TuConnector</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="nav-links">
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Trang chủ
            </Link>

            <Link
              to="/tutors"
              className={`nav-link ${location.pathname === '/tutors' ? 'active' : ''}`}
            >
              Tìm gia sư
            </Link>

            <Link
              to="/classes"
              className={`nav-link ${location.pathname === '/classes' ? 'active' : ''}`}
            >
              Lớp học
            </Link>

            {/* Dropdown: Dạy & Học */}
            <div className="nav-dropdown">
              <button
                className={`nav-dropdown-trigger ${isTeachingActive ? 'active' : ''}`}
                type="button"
              >
                <span>Dạy & Học</span>
                <span className="nav-dropdown-arrow">▼</span>
              </button>
              <div className="nav-dropdown-menu">
                <Link
                  to="/connections"
                  className={`nav-dropdown-item ${location.pathname === '/connections' ? 'active' : ''}`}
                >
                  <span className="nav-dropdown-icon">🤝</span>
                  <span>Kết nối của tôi</span>
                </Link>
                <Link
                  to="/applications"
                  className={`nav-dropdown-item ${location.pathname === '/applications' ? 'active' : ''}`}
                >
                  <span className="nav-dropdown-icon">📝</span>
                  <span>Gia sư ứng tuyển</span>
                </Link>
                <Link
                  to="/invitations"
                  className={`nav-dropdown-item ${location.pathname === '/invitations' ? 'active' : ''}`}
                >
                  <span className="nav-dropdown-icon">✉️</span>
                  <span>Lời mời dạy kèm</span>
                </Link>
              </div>
            </div>

            {/* Dropdown: Quản trị */}
            <div className="nav-dropdown">
              <button
                className={`nav-dropdown-trigger ${isAdminActive ? 'active' : ''}`}
                type="button"
              >
                <span>Quản trị</span>
                <span className="nav-dropdown-arrow">▼</span>
              </button>
              <div className="nav-dropdown-menu">
                <Link
                  to="/admin/moderation"
                  className={`nav-dropdown-item ${location.pathname === '/admin/moderation' ? 'active' : ''}`}
                >
                  <span className="nav-dropdown-icon">🛡️</span>
                  <span>Kiểm duyệt nội dung</span>
                </Link>
                <Link
                  to="/admin/dashboard"
                  className={`nav-dropdown-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
                >
                  <span className="nav-dropdown-icon">📈</span>
                  <span>Thống kê hệ thống</span>
                </Link>
              </div>
            </div>

            <Link
              to="/about"
              className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
            >
              Giới thiệu
            </Link>
          </div>

          {/* Nav Actions */}
          <div className="nav-actions">
            {/* Notification Bell Button */}
            <Link
              to="/notifications"
              className={`nav-noti-btn ${location.pathname === '/notifications' ? 'active' : ''}`}
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

            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-ghost">
                  Dashboard
                </Link>
                <Link to="/profile" className="btn btn-outline">
                  {user.name || user.email || 'Tài khoản'}
                </Link>
                <button
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

            {/* Mobile Hamburger Button */}
            <button
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

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer open">
            <div>
              <div className="mobile-nav-section-title">Điều hướng chính</div>
              <div className="mobile-nav-group">
                <Link
                  to="/"
                  className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>🏠 Trang chủ</span>
                </Link>
                <Link
                  to="/tutors"
                  className={`mobile-nav-item ${location.pathname === '/tutors' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>🔍 Tìm gia sư</span>
                </Link>
                <Link
                  to="/classes"
                  className={`mobile-nav-item ${location.pathname === '/classes' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>🏫 Lớp học</span>
                </Link>
                <Link
                  to="/about"
                  className={`mobile-nav-item ${location.pathname === '/about' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>ℹ️ Giới thiệu</span>
                </Link>
              </div>
            </div>

            <div>
              <div className="mobile-nav-section-title">Dạy & Học</div>
              <div className="mobile-nav-group">
                <Link
                  to="/connections"
                  className={`mobile-nav-item ${location.pathname === '/connections' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>🤝 Kết nối của tôi</span>
                </Link>
                <Link
                  to="/applications"
                  className={`mobile-nav-item ${location.pathname === '/applications' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>📝 Gia sư ứng tuyển</span>
                </Link>
                <Link
                  to="/invitations"
                  className={`mobile-nav-item ${location.pathname === '/invitations' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>✉️ Lời mời dạy kèm</span>
                </Link>
              </div>
            </div>

            <div>
              <div className="mobile-nav-section-title">Hệ thống & Tiện ích</div>
              <div className="mobile-nav-group">
                <Link
                  to="/notifications"
                  className={`mobile-nav-item ${location.pathname === '/notifications' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>🔔 Trung tâm thông báo</span>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '11px',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '10px'
                      }}
                    >
                      {unreadCount} mới
                    </span>
                  )}
                </Link>
                <Link
                  to="/admin/moderation"
                  className={`mobile-nav-item ${location.pathname === '/admin/moderation' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>🛡️ Kiểm duyệt nội dung</span>
                </Link>
                <Link
                  to="/admin/dashboard"
                  className={`mobile-nav-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>📈 Thống kê hệ thống</span>
                </Link>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                paddingTop: '16px',
                borderTop: '1px solid var(--gray-100)',
                marginTop: '4px'
              }}
            >
              {user ? (
                <>
                  <Link
                    to="/profile"
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Hồ sơ
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setMobileMenuOpen(false);
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
                    style={{ flex: 1 }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Main Outlet */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Site Footer */}
      <footer className="site-footer">
        <div className="footer-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link to="/" className="nav-brand">
                <div className="brand-icon">Tu</div>
                <span>TuConnector</span>
              </Link>
              <p>
                Nền tảng công nghệ kết nối gia sư và phụ huynh hàng đầu, tích
                hợp không gian giảng dạy và trợ lý học tập AI thông minh.
              </p>
            </div>

            <div className="footer-col">
              <h4>Dành cho phụ huynh</h4>
              <ul>
                <li>
                  <Link to="/tutors">Tìm kiếm gia sư</Link>
                </li>
                <li>
                  <Link to="/requests">Đăng yêu cầu tìm gia sư</Link>
                </li>
                <li>
                  <Link to="/pricing">Bảng giá dịch vụ</Link>
                </li>
                <li>
                  <a href="#testimonials">Đánh giá từ phụ huynh</a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Dành cho gia sư</h4>
              <ul>
                <li>
                  <Link to="/register">Đăng ký làm gia sư</Link>
                </li>
                <li>
                  <Link to="/requests">Duyệt bài tuyển dụng</Link>
                </li>
                <li>
                  <Link to="/workspace">Tutor Workspace</Link>
                </li>
                <li>
                  <Link to="/credit-plans">Gói cước & Credits</Link>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Hỗ trợ & Pháp lý</h4>
              <ul>
                <li>
                  <a href="#about">Về chúng tôi</a>
                </li>
                <li>
                  <a href="#help">Trung tâm trợ giúp</a>
                </li>
                <li>
                  <a href="#privacy">Chính sách bảo mật</a>
                </li>
                <li>
                  <a href="#terms">Điều khoản sử dụng</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              &copy; {new Date().getFullYear()} TuConnector System (Group 2 -
              SE1937-NJ). All rights reserved.
            </p>
            <div className="footer-bottom-links">
              <a href="#privacy">Quyền riêng tư</a>
              <a href="#terms">Điều khoản</a>
              <a href="#security">Bảo mật</a>
              <a href="#contact">Liên hệ</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}