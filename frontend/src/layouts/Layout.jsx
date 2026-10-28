import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Trang chủ', path: '/' },
    { label: 'Tìm gia sư', path: '/tutors' },
    { label: 'Ứng tuyển (SC17)', path: '/applications' },
    { label: 'Lời mời dạy (SC29)', path: '/invitations' },
    { label: 'Kết nối (SC22)', path: '/connections' },
    { label: 'Lớp học', path: '/classes' },
    { label: 'Giới thiệu', path: '/about' },
  ];

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

          {/* Nav links (Desktop) */}
          <div className="nav-links">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Nav Actions */}
          <div className="nav-actions">
            {user ? (
              <>
                <Link to="/dashboard" className="btn btn-ghost">
                  Dashboard
                </Link>
                <Link to="/profile" className="btn btn-outline">
                  {user.name || user.email || 'Tài khoản'}
                </Link>
                <button onClick={handleLogout} className="btn btn-ghost" style={{ color: '#EF4444' }}>
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

            {/* Mobile Menu Button */}
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-nav-drawer open">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid var(--gray-100)' }}>
              {user ? (
                <>
                  <Link to="/profile" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setMobileMenuOpen(false)}>
                    Hồ sơ
                  </Link>
                  <button onClick={handleLogout} className="btn btn-ghost" style={{ color: '#EF4444' }}>
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setMobileMenuOpen(false)}>
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="btn btn-primary" style={{ flex: 1 }} onClick={() => setMobileMenuOpen(false)}>
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
                Nền tảng công nghệ kết nối gia sư và phụ huynh hàng đầu, tích hợp không gian giảng dạy và trợ lý học tập AI thông minh.
              </p>
            </div>

            <div className="footer-col">
              <h4>Dành cho phụ huynh</h4>
              <ul>
                <li><Link to="/tutors">Tìm kiếm gia sư</Link></li>
                <li><Link to="/requests">Đăng yêu cầu tìm gia sư</Link></li>
                <li><Link to="/pricing">Bảng giá dịch vụ</Link></li>
                <li><a href="#testimonials">Đánh giá từ phụ huynh</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Dành cho gia sư</h4>
              <ul>
                <li><Link to="/register">Đăng ký làm gia sư</Link></li>
                <li><Link to="/requests">Duyệt bài tuyển dụng</Link></li>
                <li><Link to="/workspace">Tutor Workspace</Link></li>
                <li><Link to="/credit-plans">Gói cước & Credits</Link></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Hỗ trợ & Pháp lý</h4>
              <ul>
                <li><a href="#about">Về chúng tôi</a></li>
                <li><a href="#help">Trung tâm trợ giúp</a></li>
                <li><a href="#privacy">Chính sách bảo mật</a></li>
                <li><a href="#terms">Điều khoản sử dụng</a></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} TuConnector System (Group 2 - SE1937-NJ). All rights reserved.</p>
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