import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  SlidersHorizontal,
  ArrowRight,
  Inbox,
  Clock,
  Sparkles,
  FileText,
  Mail,
  Handshake,
  Calendar,
  BookOpen,
  CreditCard,
  PhoneCall,
  X,
  LoaderCircle
} from 'lucide-react';
import { notificationService } from '../../services/notificationService';
import '../../styles/Notifications.css';

const CATEGORIES = [
  { key: 'ALL', label: 'Tất cả', Icon: Inbox },
  { key: 'APPLICATION', label: 'Ứng tuyển gia sư', Icon: FileText },
  { key: 'INVITATION', label: 'Lời mời dạy kèm', Icon: Mail },
  { key: 'CONVERSATION', label: 'Kết nối & Thỏa thuận', Icon: Handshake },
  { key: 'SESSION', label: 'Buổi học & Lịch', Icon: Calendar },
  { key: 'ASSIGNMENT', label: 'Bài tập & Điểm số', Icon: BookOpen },
  { key: 'SYSTEM', label: 'Hệ thống & Ví', Icon: CreditCard }
];

const CATEGORY_META = {
  APPLICATION: { label: 'Ứng tuyển gia sư', Icon: FileText, className: 'cat-application' },
  INVITATION: { label: 'Lời mời dạy kèm', Icon: Mail, className: 'cat-invitation' },
  CONVERSATION: { label: 'Kết nối & Thỏa thuận', Icon: Handshake, className: 'cat-conversation' },
  SESSION: { label: 'Lịch học & Buổi dạy', Icon: Calendar, className: 'cat-session' },
  ASSIGNMENT: { label: 'Bài tập & Điểm', Icon: BookOpen, className: 'cat-assignment' },
  SYSTEM: { label: 'Hệ thống & Ví', Icon: CreditCard, className: 'cat-system' }
};

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
      console.error("Không thể tải thông báo:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const timer = setInterval(fetchNotifications, 10000);
    return () => clearInterval(timer);
  }, [activeCategory, readFilter]);

  useEffect(() => {
    notificationService
      .getPreferences()
      .then((prefs) => {
        if (prefs) {
          setPreferences((prev) => ({
            ...prev,
            applicationEmail: prefs.enable_email ?? true,
            invitationEmail: prefs.enable_email ?? true,
            sessionEmail: prefs.notify_on_sessions ?? true,
            sessionSMS: prefs.enable_sms ?? false,
            assignmentEmail: prefs.notify_on_assignments ?? true,
            systemEmail: prefs.enable_email ?? true,
          }));
        }
      })
      .catch(() => {});
  }, []);

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

  const handleTogglePref = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePreferences = async () => {
    try {
      await notificationService.updatePreferences({
        enable_in_app: true,
        enable_email: Boolean(preferences.applicationEmail || preferences.invitationEmail || preferences.systemEmail),
        enable_sms: Boolean(preferences.sessionSMS || preferences.invitationSMS || preferences.applicationSMS),
        notify_on_sessions: Boolean(preferences.sessionEmail || preferences.sessionSMS),
        notify_on_assignments: Boolean(preferences.assignmentEmail),
        notify_on_messages: true,
      });
      setShowPreferences(false);
      showToast('Đã lưu cấu hình nhận thông báo (Email / SMS) vào hệ thống!');
    } catch {
      showToast('Không thể lưu cấu hình thông báo.');
    }
  };

  return (
    <div className="noti-page">
      <div className="noti-container">
        {toastMessage && (
          <div className="noti-toast-banner" role="status">
            <Sparkles size={16} className="noti-toast-icon" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Header */}
        <div className="noti-header">
          <div className="noti-title-wrap">
            <div className="noti-icon-badge">
              <Bell size={24} />
            </div>
            <div className="noti-title-box">
              <h1>
                Trung tâm thông báo
                {unreadCount > 0 && (
                  <span className="noti-unread-tag">{unreadCount} mới</span>
                )}
              </h1>
              <p>
                Cập nhật tức thì các hoạt động ứng tuyển, lời mời nhận lớp, kết nối và lịch học
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
                <CheckCheck size={16} />
                <span>Đánh dấu tất cả đã đọc</span>
              </button>
            )}
            <button
              className="btn-preferences"
              onClick={() => setShowPreferences(true)}
              title="Cài đặt kênh nhận thông báo (Email, SMS)"
            >
              <SlidersHorizontal size={16} />
              <span>Kênh nhận tin</span>
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="noti-filters-bar">
          <div className="noti-categories">
            {CATEGORIES.map((cat) => {
              const IconComp = cat.Icon;
              return (
                <button
                  key={cat.key}
                  className={`cat-btn ${activeCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.key)}
                >
                  <IconComp size={15} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
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
        {loading && notifications.length === 0 ? (
          <div className="noti-empty">
            <LoaderCircle size={36} className="spin noti-empty-spinner" />
            <h3>Đang tải thông báo...</h3>
          </div>
        ) : notifications.length === 0 ? (
          <div className="noti-empty">
            <div className="noti-empty-icon-wrap">
              <Inbox size={44} strokeWidth={1.5} />
            </div>
            <h3>Không có thông báo nào</h3>
            <p>
              Bạn đã xem hết các thông báo trong mục này. Khi có tương tác mới, hệ thống sẽ báo ngay cho bạn!
            </p>
          </div>
        ) : (
          <div className="noti-list">
            {notifications.map((item) => {
              const meta = CATEGORY_META[item.category] || CATEGORY_META.SYSTEM;
              const MetaIcon = meta.Icon;

              return (
                <article
                  key={item._id}
                  className={`noti-item ${!item.is_read ? 'unread' : 'is-read'}`}
                  onClick={() => handleNavigateDeepLink(item)}
                >
                  <div className={`noti-type-icon ${meta.className}`}>
                    <MetaIcon size={20} />
                  </div>

                  <div className="noti-body-content">
                    <div className="noti-top-meta">
                      <span className={`noti-category-badge ${meta.className}`}>
                        {meta.label}
                      </span>
                      <span className="noti-time">
                        <Clock size={12} />
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
                            {log.channel === 'IN_APP' && (
                              <>
                                <Bell size={11} /> Trong ứng dụng
                              </>
                            )}
                            {log.channel === 'EMAIL' && (
                              <>
                                <Mail size={11} /> Email đã gửi
                              </>
                            )}
                            {log.channel === 'SMS' && (
                              <>
                                <PhoneCall size={11} /> Cổng SMS
                              </>
                            )}
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
                        <span>Xem chi tiết</span>
                        <ArrowRight size={14} />
                      </button>

                      {!item.is_read && (
                        <button
                          className="btn-single-read"
                          onClick={(e) => handleMarkAsRead(item._id, e)}
                          title="Đánh dấu đã đọc"
                        >
                          <Check size={14} />
                          <span>Đã đọc</span>
                        </button>
                      )}

                      <button
                        className="btn-single-delete"
                        onClick={(e) => handleDelete(item._id, e)}
                        title="Xóa thông báo"
                        aria-label="Xóa thông báo"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SlidersHorizontal size={18} color="#0284c7" />
                  <h3>Cài đặt kênh nhận thông báo</h3>
                </div>
                <button
                  className="noti-modal-close"
                  onClick={() => setShowPreferences(false)}
                  aria-label="Đóng"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="noti-modal-body">
                <p className="noti-modal-intro">
                  Tùy chỉnh thông báo qua Email hoặc SMS để luôn nhận được tin tức nhanh nhất về kết nối và lịch học.
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
                    <span className="pref-title">Ví tín dụng & Nạp tiền</span>
                    <span className="pref-subtitle">
                      Giao dịch nạp tín dụng và gia hạn gói thành công
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
                  <span>Lưu cấu hình</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
