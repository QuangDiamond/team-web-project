import { useState, useEffect, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  Inbox,
  Clock,
  ArrowRight,
  LoaderCircle,
  FileText,
  Mail,
  Handshake,
  Calendar,
  BookOpen,
  CreditCard,
  LayoutDashboard,
  LogIn,
  LogOut,
  UserRound,
  UserRoundPlus
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getHomePathByRole } from '../utils/getHomePathByRole';
import * as notiServiceModule from '../services/notificationService';
import { getMyProfile } from '../services/tutorProfileService';
import { getInitials } from '../utils/getInitials';
import { getRoleLabel } from '../constants/dashboardNav';
import FloatingChatWidget from '../components/chat/FloatingChatWidget';

const getUnreadCount = notiServiceModule.getUnreadCount;
const notificationService = notiServiceModule.notificationService || {
  getNotifications: async () => ({ data: { items: [] } }),
  markAsRead: async () => {},
  markAllAsRead: async () => {}
};

const AVATAR_PALETTE = ['#0284C7', '#6366F1', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#0D9488'];

const getAvatarBg = (name) => {
  if (!name) return AVATAR_PALETTE[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

const getRelativeTime = (isoString) => {
  if (!isoString) return 'Gần đây';
  const diff = Math.floor((new Date() - new Date(isoString)) / 1000);
  if (diff < 60) return 'Vừa xong';
  if (diff < 3600) return `${Math.floor(diff / 60)}p trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
};

const NOTI_ICONS = {
  APPLICATION: FileText,
  INVITATION: Mail,
  CONVERSATION: Handshake,
  SESSION: Calendar,
  ASSIGNMENT: BookOpen,
  SYSTEM: CreditCard
};

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [ownProfile, setOwnProfile] = useState(null);

  // Notifications Popover Dropdown state
  const [notiDropdownOpen, setNotiDropdownOpen] = useState(false);
  const [recentNotis, setRecentNotis] = useState([]);
  const [loadingNotis, setLoadingNotis] = useState(false);

  const notiRef = useRef(null);

  const userId = user?.id || user?._id;
  const activeSection = location.pathname === '/' ? location.hash : null;

  useEffect(() => {
    if (location.pathname !== '/') return;
    const frame = requestAnimationFrame(() => {
      const behavior = window.matchMedia('(prefers-reduced-motion: reduce)')
        .matches
        ? 'auto'
        : 'smooth';
      if (location.hash) {
        document
          .getElementById(location.hash.slice(1))
          ?.scrollIntoView({ behavior });
      } else {
        window.scrollTo({ top: 0, behavior });
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname, location.hash, location.key]);

  // Click outside listener for notification dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notiRef.current && !notiRef.current.contains(e.target)) {
        setNotiDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch tutor profile if tutor
  useEffect(() => {
    if (user?.role !== 'TUTOR' || !userId) return;
    let ignore = false;
    getMyProfile()
      .then((response) => {
        if (!ignore)
          setOwnProfile({ userId, profileId: response.data.profile?._id });
      })
      .catch(() => {
        if (!ignore) setOwnProfile(null);
      });
    return () => {
      ignore = true;
    };
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
  let messagesPath = '/login';
  if (user && user.role) {
    dashboardPath = getHomePathByRole(user.role);
    notificationsPath = `/${user.role.toLowerCase()}/notifications`;
    messagesPath = `/${user.role.toLowerCase()}/messages`;
  }

  // Fetch Notification unread count periodically
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    const fetchUnread = () => {
      getUnreadCount()
        .then((res) => {
          const count = res?.data?.unreadCount ?? res?.unreadCount;
          if (typeof count === 'number') {
            setUnreadCount(count);
          }
        })
        .catch(() => {});
    };

    fetchUnread();
    const timer = setInterval(fetchUnread, 5000);
    return () => clearInterval(timer);
  }, [user, location.pathname]);

  // Handle opening notification dropdown
  const handleToggleNotiDropdown = async () => {
    const nextState = !notiDropdownOpen;
    setNotiDropdownOpen(nextState);

    if (nextState) {
      setLoadingNotis(true);
      try {
        const res = await notificationService.getNotifications({ limit: 5 });
        setRecentNotis(res.notifications || []);
        if (typeof res.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      } catch (err) {
        console.error('Failed to load recent notifications:', err);
      } finally {
        setLoadingNotis(false);
      }
    }
  };

  const handleMarkAllNotisRead = async (e) => {
    e.stopPropagation();
    try {
      await notificationService.markAllAsRead();
      setRecentNotis((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const handleNotiItemClick = async (item) => {
    if (!item.is_read) {
      try {
        await notificationService.markAsRead(item._id);
        setUnreadCount((c) => Math.max(0, c - 1));
        setRecentNotis((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, is_read: true } : n))
        );
      } catch {}
    }
    setNotiDropdownOpen(false);
    if (item.deepLink) {
      navigate(item.deepLink);
    } else {
      navigate(notificationsPath);
    }
  };

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
            <Link
              to="/#features"
              className={`nav-link ${activeSection === '#features' ? 'active' : ''}`}
              aria-current={activeSection === '#features' ? 'location' : undefined}
            >
              Tính năng
            </Link>
            <Link
              to="/#featured-tutors"
              className={`nav-link ${activeSection === '#featured-tutors' ? 'active' : ''}`}
              aria-current={activeSection === '#featured-tutors' ? 'location' : undefined}
            >
              Gia sư tiêu biểu
            </Link>
            <Link
              to="/#how-it-works"
              className={`nav-link ${activeSection === '#how-it-works' ? 'active' : ''}`}
              aria-current={activeSection === '#how-it-works' ? 'location' : undefined}
            >
              Cách hoạt động
            </Link>
            <Link
              to="/tutors"
              className={`nav-link ${location.pathname === '/tutors' ? 'active' : ''}`}
              aria-current={
                location.pathname === '/tutors' ? 'page' : undefined
              }
            >
              Gia sư
            </Link>
          </div>

          <div className="nav-actions">
            {user ? (
              <>
                {/* Notifications Popover Dropdown (Homepage Experience) */}
                <div className="nav-dropdown-wrap" ref={notiRef}>
                  <button
                    type="button"
                    className={`nav-noti-btn ${notiDropdownOpen ? 'active' : ''}`}
                    onClick={handleToggleNotiDropdown}
                    title="Thông báo hệ thống"
                    aria-label="Thông báo hệ thống"
                    aria-expanded={notiDropdownOpen}
                  >
                    <Bell size={19} />
                    {unreadCount > 0 && (
                      <span className="nav-noti-badge">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notiDropdownOpen && (
                    <div className="nav-popover">
                      <div className="nav-popover-header">
                        <div className="nav-popover-title">
                          <span>Thông báo</span>
                          {unreadCount > 0 && (
                            <span className="nav-popover-count-tag">
                              {unreadCount} mới
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            className="nav-popover-action"
                            onClick={handleMarkAllNotisRead}
                          >
                            <CheckCheck size={14} />
                            <span>Đã đọc hết</span>
                          </button>
                        )}
                      </div>

                      {loadingNotis ? (
                        <div className="nav-popover-empty">
                          <LoaderCircle size={22} className="spin" color="#0284c7" />
                          <span>Đang tải thông báo...</span>
                        </div>
                      ) : recentNotis.length === 0 ? (
                        <div className="nav-popover-empty">
                          <Inbox size={32} strokeWidth={1.5} color="#94a3b8" />
                          <span>Không có thông báo mới nào</span>
                        </div>
                      ) : (
                        <ul className="nav-popover-list">
                          {recentNotis.map((item) => {
                            const IconComponent = NOTI_ICONS[item.category] || CreditCard;
                            const time = getRelativeTime(item.created_at);

                            return (
                              <li
                                key={item._id}
                                className={`nav-popover-item ${!item.is_read ? 'unread' : ''}`}
                                onClick={() => handleNotiItemClick(item)}
                              >
                                <div className="nav-popover-icon">
                                  <IconComponent size={17} />
                                </div>
                                <div className="nav-popover-content">
                                  <div className="nav-popover-heading">
                                    <span>{item.title}</span>
                                    <span className="nav-popover-time">{time}</span>
                                  </div>
                                  <p className="nav-popover-desc">{item.body}</p>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      )}

                      <Link
                        to={notificationsPath}
                        className="nav-popover-footer"
                        onClick={() => setNotiDropdownOpen(false)}
                      >
                        Xem tất cả thông báo trong Dashboard →
                      </Link>
                    </div>
                  )}
                </div>

                <Link to={dashboardPath} className="btn btn-primary nav-round-action" aria-label="Bảng điều khiển" title="Bảng điều khiển">
                  <LayoutDashboard size={19} aria-hidden="true" />
                </Link>
                <Link to={profilePath} className="btn btn-outline nav-round-action" aria-label="Hồ sơ của tôi" title={user.full_name || 'Hồ sơ của tôi'}>
                  <UserRound size={19} aria-hidden="true" />
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="btn btn-ghost nav-round-action nav-logout-action"
                  aria-label="Đăng xuất"
                  title="Đăng xuất"
                >
                  <LogOut size={19} aria-hidden="true" />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost nav-round-action" aria-label="Đăng nhập" title="Đăng nhập">
                  <LogIn size={19} aria-hidden="true" />
                </Link>
                <Link to="/register" className="btn btn-primary nav-round-action" aria-label="Đăng ký" title="Đăng ký">
                  <UserRoundPlus size={19} aria-hidden="true" />
                </Link>
              </>
            )}

            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Mở/đóng menu"
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
                  aria-current={
                    activeSection === '#features' ? 'location' : undefined
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Tính năng</span>
                </Link>
                <Link
                  to="/#featured-tutors"
                  className={`mobile-nav-item ${activeSection === '#featured-tutors' ? 'active' : ''}`}
                  aria-current={
                    activeSection === '#featured-tutors'
                      ? 'location'
                      : undefined
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Gia sư tiêu biểu</span>
                </Link>
                <Link
                  to="/#how-it-works"
                  className={`mobile-nav-item ${activeSection === '#how-it-works' ? 'active' : ''}`}
                  aria-current={
                    activeSection === '#how-it-works' ? 'location' : undefined
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Cách hoạt động</span>
                </Link>
                <Link
                  to="/tutors"
                  className={`mobile-nav-item ${location.pathname === '/tutors' ? 'active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span>Gia sư</span>
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
                    Vào bảng điều khiển ({getRoleLabel(user.role)})
                  </Link>
                  <Link
                    to={messagesPath}
                    className="btn btn-outline"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Tin nhắn
                  </Link>
                  <Link
                    to={notificationsPath}
                    className="btn btn-outline"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Thông báo {unreadCount > 0 ? `(${unreadCount})` : ''}
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
            <Link to="/" className="footer-brand">
              <div className="footer-logo">
                <div className="brand-icon">Tu</div>
                <span>TuConnector</span>
              </div>
              <p>
                Nền tảng kết nối gia sư và phụ huynh thông minh hàng đầu Việt
                Nam. Ứng dụng AI ghép đôi chính xác và quản lý lịch dạy hiệu
                quả.
              </p>
            </Link>

            <div className="footer-column">
              <h4>Dành cho phụ huynh</h4>
              <ul>
                <li>
                  <Link to="/">Trang chủ</Link>
                </li>
                <li>
                  <a href="/#features">Tính năng nổi bật</a>
                </li>
                <li>
                  <a href="/#featured-tutors">Gia sư tiêu biểu</a>
                </li>
                <li>
                  <a href="/#how-it-works">Quy trình kết nối</a>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Dành cho gia sư</h4>
              <ul>
                <li>
                  <Link to={user ? dashboardPath : '/login'}>
                    Bảng điều khiển
                  </Link>
                </li>
                <li>
                  <Link to="/register">Đăng ký Phụ huynh / Gia sư</Link>
                </li>
                <li>
                  <Link to="/payment">Gói dịch vụ &amp; credits</Link>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Hỗ trợ &amp; Quy định</h4>
              <ul>
                <li>
                  <a href="/#how-it-works">Hướng dẫn sử dụng</a>
                </li>
                <li>
                  <Link to="/login">Đăng nhập tài khoản</Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom">
            <p>
              &copy; {new Date().getFullYear()} TuConnector. Bảo lưu mọi quyền.
            </p>
            <div className="footer-bottom-links">
              <Link to="/">Trang chủ</Link>
              <Link to="/login">Đăng nhập</Link>
              <Link to="/register">Đăng ký</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Draggable Floating Messenger Chat Widget */}
      <FloatingChatWidget />
    </div>
  );
}
