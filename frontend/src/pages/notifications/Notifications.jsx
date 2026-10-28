import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notificationService } from '../../services/notificationService';
import '../../styles/Notifications.css';

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả', icon: '📢' },
  { key: 'APPLICATION', label: 'Ứng tuyển gia sư', icon: '📝' },
  { key: 'INVITATION', label: 'Lời mời dạy kèm', icon: '✉️' },
  { key: 'CONVERSATION', label: 'Kết nối & Thỏa thuận', icon: '🤝' },
  { key: 'SESSION', label: 'Buổi học & Lịch', icon: '📅' },
  { key: 'ASSIGNMENT', label: 'Bài tập & Điểm số', icon: '📚' },
  { key: 'SYSTEM', label: 'Hệ thống & Ví', icon: '💳' }
];

export default function Notifications() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [readFilter, setReadFilter] = useState('all'); // all, unread, read
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);

  // Preference settings state (Alternative Flow A1)
  const [preferences, setPreferences] = useState({
    applicationEmail: true,
    applicationSMS: false,
    invitationEmail: true,
    invitationSMS: true,
    sessionEmail: true,
    sessionSMS: true,
    assignmentEmail: true,
    assignmentSMS: false,
    systemEmail: true,
    systemSMS: false
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCategory !== 'ALL') {
        params.category = activeCategory;
      }
      if (readFilter === 'unread') {
        params.is_read = false;
      } else if (readFilter === 'read') {
        params.is_read = true;
      }

      const res = await notificationService.getNotifications(params);
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeCategory, readFilter]);

  const handleMarkAsRead = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      showToast('Đã đánh dấu là đã đọc.');
    } catch {
      showToast('Không thể cập nhật trạng thái.');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
      showToast('Tất cả thông báo đã được đánh dấu đã đọc!');
    } catch {
      showToast('Có lỗi xảy ra khi cập nhật.');
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      showToast('Đã xóa thông báo.');
    } catch {
      showToast('Không thể xóa thông báo.');
    }
  };

  const handleNavigateDeepLink = async (item) => {
    if (!item.is_read) {
      await handleMarkAsRead(item._id);
    }
    if (item.deepLink) {
      navigate(item.deepLink);
    }
  };

  const getRelativeTime = (isoString) => {
    if (!isoString) return 'Gần đây';
    const diff = Math.floor((new Date() - new Date(isoString)) / 1000);
    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return `${Math.floor(diff / 86400)} ngày trước`;
  };

  const getCategoryClass = (cat) => {
    switch (cat) {
      case 'APPLICATION':
        return 'cat-application';
      case 'INVITATION':
        return 'cat-invitation';
      case 'CONVERSATION':
        return 'cat-conversation';
      case 'SESSION':
        return 'cat-session';
      case 'ASSIGNMENT':
        return 'cat-assignment';
      default:
        return 'cat-system';
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'APPLICATION':
        return '📝';
      case 'INVITATION':
        return '✉️';
      case 'CONVERSATION':
        return '🤝';
      case 'SESSION':
        return '📅';
      case 'ASSIGNMENT':
        return '📚';
      default:
        return '🔔';
    }
  };

  const handleTogglePref = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = () => {
    setShowPreferences(false);
    showToast('Đã lưu cấu hình nhận thông báo (Email / SMS)!');
  };

  return (
    <div className="noti-page">
      <div className="noti-container">
        {toastMessage && (
          <div
            style={{
              position: 'fixed',
              top: '24px',
              right: '24px',
              background: '#0f172a',
              color: '#ffffff',
              padding: '12px 24px',
              borderRadius: '8px',
              zIndex: 9999,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>✨</span> {toastMessage}
          </div>
        )}

        {/* Header */}
        <div className="noti-header">
          <div className="noti-title-wrap">
            <div className="noti-icon-badge">🔔</div>
            <div className="noti-title-box">
              <h1>
                Thông báo (SC10)
                {unreadCount > 0 && (
                  <span className="noti-unread-tag">{unreadCount} mới</span>
                )}
              </h1>
              <p>
                Cập nhật tức thì các hoạt động ứng tuyển, lời mời, thỏa thuận kết
                nối và lịch học
              </p>
            </div>
          </div>

          <div className="noti-header-actions">
            {unreadCount > 0 && (
              <button
                className="btn-mark-all"
                onClick={handleMarkAllAsRead}
                title="Đánh dấu tất cả thông báo là đã đọc"
              >
                ✓ Đánh dấu tất cả đã đọc
              </button>
            )}
            <button
              className="btn-preferences"
              onClick={() => setShowPreferences(true)}
              title="Cài đặt kênh nhận thông báo (Email, SMS)"
            >
              ⚙️ Kênh nhận tin
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="noti-filters-bar">
          <div className="noti-categories">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                className={`cat-btn ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                <span>{cat.icon}</span> {cat.label}
              </button>
            ))}
          </div>

          <div className="noti-read-filters">
            <button
              className={`read-btn ${readFilter === 'all' ? 'active' : ''}`}
              onClick={() => setReadFilter('all')}
            >
              Tất cả
            </button>
            <button
              className={`read-btn ${readFilter === 'unread' ? 'active' : ''}`}
              onClick={() => setReadFilter('unread')}
            >
              Chưa đọc
            </button>
            <button
              className={`read-btn ${readFilter === 'read' ? 'active' : ''}`}
              onClick={() => setReadFilter('read')}
            >
              Đã đọc
            </button>
          </div>
        </div>

        {/* Notifications list */}
        {loading ? (
          <div className="noti-empty">
            <div className="noti-empty-icon">⏳</div>
            <h3>Đang tải thông báo...</h3>
          </div>
        ) : notifications.length === 0 ? (
          <div className="noti-empty">
            <div className="noti-empty-icon">📭</div>
            <h3>Không có thông báo nào</h3>
            <p>
              Bạn đã cập nhật hết tất cả các thông báo trong mục này. Chúc bạn một
              ngày học tập & giảng dạy hiệu quả!
            </p>
          </div>
        ) : (
          <div className="noti-list">
            {notifications.map((item) => (
              <div
                key={item._id}
                className={`noti-item ${!item.is_read ? 'unread' : ''}`}
                onClick={() => handleNavigateDeepLink(item)}
                style={{ cursor: 'pointer' }}
              >
                <div
                  className={`noti-type-icon ${getCategoryClass(item.category)}`}
                >
                  {getCategoryIcon(item.category)}
                </div>

                <div className="noti-body-content">
                  <div className="noti-top-meta">
                    <span
                      className={`noti-category-badge ${getCategoryClass(
                        item.category
                      )}`}
                    >
                      {item.category}
                    </span>
                    <span className="noti-time">
                      {getRelativeTime(item.created_at)}
                    </span>
                  </div>

                  <h3 className="noti-heading">{item.title}</h3>
                  <p className="noti-desc">{item.body}</p>

                  {/* Delivery logs per UC35 / Pro plan SMS Gateway */}
                  {item.delivery_logs && item.delivery_logs.length > 0 && (
                    <div className="noti-delivery-logs">
                      {item.delivery_logs.map((log, idx) => (
                        <span
                          key={idx}
                          className={`delivery-badge badge-${log.channel.toLowerCase()}`}
                        >
                          {log.channel === 'IN_APP' && '🔔 In-App'}
                          {log.channel === 'EMAIL' && '✉️ Email đã gửi'}
                          {log.channel === 'SMS' && '📱 SMS Gateway'}
                          {log.status === 'DELIVERED' ? ' ✓' : ''}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="noti-item-actions">
                    <button
                      className="btn-open-deeplink"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigateDeepLink(item);
                      }}
                    >
                      Xem chi tiết →
                    </button>

                    {!item.is_read && (
                      <button
                        className="btn-single-read"
                        onClick={(e) => handleMarkAsRead(item._id, e)}
                        title="Đánh dấu đã đọc"
                      >
                        ✓ Đã đọc
                      </button>
                    )}

                    <button
                      className="btn-single-delete"
                      onClick={(e) => handleDelete(item._id, e)}
                      title="Xóa thông báo"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Preferences Modal (Alternative Flow A1) */}
        {showPreferences && (
          <div
            className="noti-modal-overlay"
            onClick={() => setShowPreferences(false)}
          >
            <div
              className="noti-modal-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="noti-modal-header">
                <h3>⚙️ Cài đặt nhận thông báo (A1)</h3>
                <button
                  style={{
                    border: 'none',
                    background: 'none',
                    fontSize: '20px',
                    cursor: 'pointer',
                    color: '#94a3b8'
                  }}
                  onClick={() => setShowPreferences(false)}
                >
                  ✕
                </button>
              </div>

              <div className="noti-modal-body">
                <p
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '16px'
                  }}
                >
                  Tùy chọn nhận thông báo qua Email hoặc SMS (gói Pro có hỗ trợ tin
                  nhắn SMS nhắc lịch học tức thì).
                </p>

                <div className="pref-row">
                  <div className="pref-label">
                    <span className="pref-title">Hồ sơ ứng tuyển gia sư</span>
                    <span className="pref-subtitle">
                      Khi có gia sư mới ứng tuyển yêu cầu tìm kiếm
                    </span>
                  </div>
                  <div className="pref-toggles">
                    <label className="pref-checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.applicationEmail}
                        onChange={() => handleTogglePref('applicationEmail')}
                      />
                      Email
                    </label>
                    <label className="pref-checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.applicationSMS}
                        onChange={() => handleTogglePref('applicationSMS')}
                      />
                      SMS
                    </label>
                  </div>
                </div>

                <div className="pref-row">
                  <div className="pref-label">
                    <span className="pref-title">Lời mời dạy kèm</span>
                    <span className="pref-subtitle">
                      Khi phụ huynh gửi lời mời nhận lớp riêng
                    </span>
                  </div>
                  <div className="pref-toggles">
                    <label className="pref-checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.invitationEmail}
                        onChange={() => handleTogglePref('invitationEmail')}
                      />
                      Email
                    </label>
                    <label className="pref-checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.invitationSMS}
                        onChange={() => handleTogglePref('invitationSMS')}
                      />
                      SMS
                    </label>
                  </div>
                </div>

                <div className="pref-row">
                  <div className="pref-label">
                    <span className="pref-title">
                      Lịch học & Buổi dạy sắp tới
                    </span>
                    <span className="pref-subtitle">
                      Nhắc nhở trước giờ học 30 phút (BR-14)
                    </span>
                  </div>
                  <div className="pref-toggles">
                    <label className="pref-checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.sessionEmail}
                        onChange={() => handleTogglePref('sessionEmail')}
                      />
                      Email
                    </label>
                    <label className="pref-checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.sessionSMS}
                        onChange={() => handleTogglePref('sessionSMS')}
                      />
                      SMS (Pro)
                    </label>
                  </div>
                </div>

                <div className="pref-row">
                  <div className="pref-label">
                    <span className="pref-title">Bài tập & Điểm số</span>
                    <span className="pref-subtitle">
                      Khi học sinh nộp bài hoặc gia sư chấm điểm
                    </span>
                  </div>
                  <div className="pref-toggles">
                    <label className="pref-checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.assignmentEmail}
                        onChange={() => handleTogglePref('assignmentEmail')}
                      />
                      Email
                    </label>
                  </div>
                </div>

                <div className="pref-row">
                  <div className="pref-label">
                    <span className="pref-title">Ví credit & Nạp tiền</span>
                    <span className="pref-subtitle">
                      Giao dịch nạp credit và gia hạn gói thành công
                    </span>
                  </div>
                  <div className="pref-toggles">
                    <label className="pref-checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.systemEmail}
                        onChange={() => handleTogglePref('systemEmail')}
                      />
                      Email
                    </label>
                  </div>
                </div>
              </div>

              <div className="noti-modal-footer">
                <button
                  className="btn-mark-all"
                  onClick={() => setShowPreferences(false)}
                >
                  Hủy
                </button>
                <button
                  className="btn-open-deeplink"
                  onClick={handleSavePreferences}
                >
                  Lưu cấu hình
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
