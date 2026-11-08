import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getHomePathByRole } from '../utils/getHomePathByRole';
import { getUnreadCount } from '../services/notificationService';
import { getMyProfile } from '../services/tutorProfileService';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ownProfile, setOwnProfile] = useState(null);
  const userId = user?.id || user?._id;
  const activeSection = location.pathname === '/' ? location.hash : null;

  useEffect(() => {
    if (location.pathname !== '/') return;
    const frame = requestAnimationFrame(() => {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
      if (location.hash) {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior });
      } else {
        window.scrollTo({ top: 0, behavior });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash, location.key]);

  useEffect(() => {
    if (user?.role !== 'TUTOR' || !userId) return;
    let ignore = false;
    getMyProfile()
      .then((response) => {
        if (!ignore) setOwnProfile({ userId, profileId: response.data.profile?._id });
      })
      .catch(() => {
        if (!ignore) setOwnProfile(null);
      });
    return () => { ignore = true; };
  }, [userId, user?.role]);

  let profilePath = '/profile';
  if (user?.role === 'PARENT' && userId) profilePath = `/parents/${userId}`;
  if (user?.role === 'TUTOR') {
    profilePath = '/tutor/profile';
    if (ownProfile && ownProfile.userId === userId && ownProfile.profileId) {
      profilePath = `/tutors/${ownProfile.profileId}`;
    }
  }

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
              className={`nav-link ${activeSection === '' ? 'active' : ''}`}
              aria-current={activeSection === '' ? 'page' : undefined}
            >
              Trang chủ
            </Link>
            <Link to="/#features" className={`nav-link ${activeSection === '#features' ? 'active' : ''}`} aria-current={activeSection === '#features' ? 'location' : undefined}>
              Tính năng
            </Link>
            <Link to="/#featured-tutors" className={`nav-link ${activeSection === '#featured-tutors' ? 'active' : ''}`} aria-current={activeSection === '#featured-tutors' ? 'location' : undefined}>
              Gia sư tiêu biểu
            </Link>
            <Link to="/#how-it-works" className={`nav-link ${activeSection === '#how-it-works' ? 'active' : ''}`} aria-current={activeSection === '#how-it-works' ? 'location' : undefined}>
              Cách hoạt động
            </Link>
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
                <Link to={dashboardPath} className="btn btn-primary">
                  Dashboard
                </Link>
                <Link to={profilePath} className="btn btn-outline">
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
                  className={`mobile-nav-item ${activeSection === '' ? 'active' : ''}`}
                  aria-current={activeSection === '' ? 'page' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Trang chủ</span>
                </Link>
                <Link
                  to="/#features"
                  className={`mobile-nav-item ${activeSection === '#features' ? 'active' : ''}`}
                  aria-current={activeSection === '#features' ? 'location' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Tính năng</span>
                </Link>
                <Link
                  to="/#featured-tutors"
                  className={`mobile-nav-item ${activeSection === '#featured-tutors' ? 'active' : ''}`}
                  aria-current={activeSection === '#featured-tutors' ? 'location' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Gia sư tiêu biểu</span>
                </Link>
                <Link
                  to="/#how-it-works"
                  className={`mobile-nav-item ${activeSection === '#how-it-works' ? 'active' : ''}`}
                  aria-current={activeSection === '#how-it-works' ? 'location' : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Cách hoạt động</span>
                </Link>
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
