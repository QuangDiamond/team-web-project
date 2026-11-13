import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Inbox, LoaderCircle } from 'lucide-react';
import { getUnreadCount, notificationService } from '../../services/notificationService';
import {
  getNotificationCategory,
  getRelativeTime,
} from '../notifications/notificationDisplay';

const POLL_INTERVAL_MS = 5000;
const MAX_VISIBLE_ITEMS = 6;
const MAX_BADGE_NUMBER = 99;

const readUnreadCount = (response) => {
  if (response && response.data && typeof response.data.unreadCount === 'number') {
    return response.data.unreadCount;
  }
  if (response && typeof response.unreadCount === 'number') {
    return response.unreadCount;
  }
  return null;
};

const formatBadge = (count) => {
  if (count > MAX_BADGE_NUMBER) {
    return `${MAX_BADGE_NUMBER}+`;
  }
  return String(count);
};

/*
 * Chuông thông báo dùng chung cho navbar trang chủ và header dashboard (UC33/UC35).
 * - Badge hiện số thông báo chưa đọc, tự cập nhật định kỳ; bằng 0 thì ẩn badge.
 * - Bấm chuông: mở danh sách thông báo gần nhất và đánh dấu tất cả là đã đọc (badge về 0).
 *   Các thông báo vừa chưa đọc vẫn được tô nổi trong lần mở này để người dùng biết cái nào mới.
 */
export default function NotificationBell({ notificationsPath, buttonClassName, onUnreadCountChange }) {
  const navigate = useNavigate();
  const location = useLocation();
  const wrapperRef = useRef(null);

  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const fetchUnread = () => {
      getUnreadCount()
        .then((response) => {
          const count = readUnreadCount(response);
          if (count !== null) {
            setUnreadCount(count);
          }
        })
        .catch(() => {});
    };

    fetchUnread();
    const timer = setInterval(fetchUnread, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [location.pathname]);

  // Báo số chưa đọc cho component cha (vd. menu mobile của Layout hiển thị "Thông báo (3)")
  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const openAndMarkAllRead = async () => {
    setIsOpen(true);
    setLoading(true);
    setLoadError('');
    try {
      const response = await notificationService.getNotifications();
      const notifications = response.notifications || [];
      setItems(notifications.slice(0, MAX_VISIBLE_ITEMS));

      const hasUnread = notifications.some((notification) => !notification.is_read);
      if (hasUnread || unreadCount > 0) {
        await notificationService.markAllAsRead();
      }
      setUnreadCount(0);
    } catch (error) {
      setLoadError(error.message || 'Không thể tải thông báo.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }
    openAndMarkAllRead();
  };

  const handleItemClick = (item) => {
    setIsOpen(false);
    if (item.deepLink) {
      navigate(item.deepLink);
      return;
    }
    navigate(notificationsPath);
  };

  let buttonClasses = buttonClassName;
  if (isOpen) {
    buttonClasses = `${buttonClassName} active`;
  }

  let ariaLabel = 'Thông báo';
  if (unreadCount > 0) {
    ariaLabel = `Thông báo, ${unreadCount} chưa đọc`;
  }

  let listContent;
  if (loading) {
    listContent = (
      <div className="nav-popover-empty">
        <LoaderCircle size={22} className="spin" aria-hidden="true" />
        <span>Đang tải thông báo...</span>
      </div>
    );
  } else if (loadError) {
    listContent = (
      <div className="nav-popover-empty" role="alert">
        <span>{loadError}</span>
      </div>
    );
  } else if (items.length === 0) {
    listContent = (
      <div className="nav-popover-empty">
        <Inbox size={32} strokeWidth={1.5} aria-hidden="true" />
        <span>Bạn chưa có thông báo nào</span>
      </div>
    );
  } else {
    listContent = (
      <ul className="nav-popover-list">
        {items.map((item) => {
          const { Icon } = getNotificationCategory(item.category);
          let itemClassName = 'nav-popover-item';
          if (!item.is_read) {
            itemClassName = 'nav-popover-item unread';
          }
          return (
            <li key={item._id}>
              <button type="button" className={itemClassName} onClick={() => handleItemClick(item)}>
                <span className="nav-popover-icon">
                  <Icon size={17} aria-hidden="true" />
                </span>
                <span className="nav-popover-content">
                  <span className="nav-popover-heading">
                    <span>{item.title}</span>
                    <span className="nav-popover-time">{getRelativeTime(item.created_at)}</span>
                  </span>
                  <span className="nav-popover-desc">{item.body}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="nav-dropdown-wrap" ref={wrapperRef}>
      <button
        type="button"
        className={buttonClasses}
        onClick={handleToggle}
        title="Thông báo"
        aria-label={ariaLabel}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Bell size={20} aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="nav-noti-badge" aria-hidden="true">
            {formatBadge(unreadCount)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="nav-popover">
          <div className="nav-popover-header">
            <span className="nav-popover-title">Thông báo</span>
          </div>
          {listContent}
          <Link to={notificationsPath} className="nav-popover-footer" onClick={() => setIsOpen(false)}>
            Xem tất cả thông báo
          </Link>
        </div>
      )}
    </div>
  );
}
