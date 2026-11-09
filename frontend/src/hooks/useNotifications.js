import { useEffect, useState } from 'react';
import { notificationService } from '../services/notificationService';
export default function useNotifications() {
  const [category, setCategory] = useState('ALL');
  const [readFilter, setReadFilter] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [revision, setRevision] = useState(0);
  const reload = () => setRevision(value => value + 1);
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = {};
    if (category !== 'ALL') {
      params.category = category;
    }
    if (readFilter !== 'all') {
      params.is_read = readFilter === 'read';
    }
    notificationService.getNotifications(params).then(response => {
      if (active) {
        setNotifications(response.notifications || []);
        setUnreadCount(response.unreadCount || 0);
      }
    }).catch(failure => {
      if (active) {
        setError(failure.message || 'Không thể tải thông báo.');
      }
    }).finally(() => {
      if (active) {
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [category, readFilter, revision]);
  const update = async (operation, success) => {
    setBusy(true);
    setError('');
    try {
      await operation();
      setMessage(success);
      reload();
      return true;
    } catch (failure) {
      setError(failure.message || 'Không thể cập nhật thông báo.');
      return false;
    } finally {
      setBusy(false);
    }
  };
  return {
    category,
    setCategory,
    readFilter,
    setReadFilter,
    notifications,
    unreadCount,
    loading,
    error,
    message,
    setMessage,
    busy,
    reload,
    markRead: id => update(() => notificationService.markAsRead(id), 'Đã đánh dấu thông báo là đã đọc.'),
    markAll: () => update(() => notificationService.markAllAsRead(), 'Đã đánh dấu tất cả thông báo là đã đọc.'),
    remove: id => update(() => notificationService.deleteNotification(id), 'Đã xóa thông báo.')
  };
}
