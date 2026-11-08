import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Inbox, Settings2 } from 'lucide-react';
import PageHeader from '../../components/common/PageHeader';
import Alert from '../../components/common/Alert';
import EmptyState from '../../components/common/EmptyState';
import NotificationCard from '../../components/notifications/NotificationCard';
import PreferencesDialog from '../../components/notifications/PreferencesDialog';
import { NOTIFICATION_CATEGORIES } from '../../components/notifications/notificationDisplay';
import useNotifications from '../../hooks/useNotifications';
import '../../styles/Notifications.css';

export default function Notifications() {
  const navigate = useNavigate();
  const data = useNotifications();
  const [showPreferences, setShowPreferences] = useState(false);
  const open = async (item) => {
    if (!item.is_read) await data.markRead(item._id);
    if (item.deepLink) navigate(item.deepLink);
  };
  const saved = (message) => { data.setMessage(message); setShowPreferences(false); };
  return <div className="noti-page">
    <PageHeader title="Trung tâm thông báo" description={`${data.unreadCount} thông báo chưa đọc. Theo dõi các cập nhật tài khoản, kết nối và lớp học.`}
      actions={<>
        {data.unreadCount > 0 && <button type="button" className="btn btn-outline" onClick={data.markAll} disabled={data.busy || data.loading}><CheckCheck size={18} aria-hidden="true" />Đọc tất cả</button>}
        <button type="button" className="btn btn-primary" onClick={() => setShowPreferences(true)}><Settings2 size={18} aria-hidden="true" />Cài đặt nhận tin</button>
      </>} />
    {data.message && <Alert type="success">{data.message}</Alert>}
    <section className="card noti-filters" aria-label="Bộ lọc thông báo">
      <div className="noti-categories" role="group" aria-label="Loại thông báo">
        {NOTIFICATION_CATEGORIES.map(({ key, label, Icon }) => <button type="button" key={key} className="noti-filter-button" aria-pressed={data.category === key} onClick={() => data.setCategory(key)}><Icon size={18} aria-hidden="true" />{label}</button>)}
      </div>
      <div className="noti-read-filters" role="group" aria-label="Trạng thái đọc">
        {[{ value: 'all', label: 'Tất cả' }, { value: 'unread', label: 'Chưa đọc' }, { value: 'read', label: 'Đã đọc' }].map((option) => <button key={option.value} type="button" className="noti-filter-button" aria-pressed={data.readFilter === option.value} onClick={() => data.setReadFilter(option.value)}>{option.label}</button>)}
      </div>
    </section>
    {data.loading && <p role="status" className="noti-muted">Đang tải thông báo...</p>}
    {data.error && <Alert type="error">{data.error}<button type="button" className="btn btn-outline btn-sm" onClick={data.reload}>Thử lại</button></Alert>}
    {!data.loading && !data.error && data.notifications.length === 0 && <div className="card"><EmptyState icon={Inbox} title="Không có thông báo" description="Thông báo mới sẽ xuất hiện tại đây. Bạn có thể thử bộ lọc khác." /></div>}
    {!data.loading && !data.error && <div className="noti-list">{data.notifications.map((item) => <NotificationCard key={item._id} item={item} busy={data.busy} onOpen={open} onRead={data.markRead} onDelete={data.remove} />)}</div>}
    {showPreferences && <PreferencesDialog onClose={() => setShowPreferences(false)} onSaved={saved} />}
  </div>;
}
