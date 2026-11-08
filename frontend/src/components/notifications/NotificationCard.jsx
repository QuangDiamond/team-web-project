import { ArrowRight, Check, CheckCheck, Clock3, Mail, Smartphone, Trash2 } from 'lucide-react';
import { getNotificationCategory, getRelativeTime } from './notificationDisplay';
export default function NotificationCard({
  item,
  busy,
  onOpen,
  onRead,
  onDelete
}) {
  const {
    label,
    Icon
  } = getNotificationCategory(item.category);
  return <article className={`noti-item${item.is_read ? '' : ' noti-item-unread'}`}>
      <span className={`noti-category-icon noti-category-${item.category}`}><Icon size={22} aria-hidden="true" /></span>
      <div className="noti-content">
        <div className="noti-item-meta"><span>{label}</span><time dateTime={item.created_at}>{getRelativeTime(item.created_at)}</time>{!item.is_read && <span className="noti-unread-label">Chưa đọc</span>}</div>
        <h2 className="noti-item-title">{item.title}</h2>
        <p className="noti-item-body">{item.body}</p>
        {item.delivery_logs?.length > 0 && <div className="noti-delivery">
          {item.delivery_logs.map((log, index) => {
          let ChannelIcon = Icon;
          let channelLabel = 'Trong ứng dụng';
          if (log.channel === 'EMAIL') {
            ChannelIcon = Mail;
            channelLabel = 'Email';
          }
          if (log.channel === 'SMS') {
            ChannelIcon = Smartphone;
            channelLabel = 'SMS';
          }
          const delivered = log.status === 'DELIVERED' || log.status === 'SENT';
          let deliveryLabel = 'Đang chờ';
          if (delivered) {
            deliveryLabel = 'Đã gửi';
          }
          if (log.status === 'FAILED') {
            deliveryLabel = 'Gửi thất bại';
          }
          return <span key={index}><ChannelIcon size={14} aria-hidden="true" />{channelLabel} · {deliveryLabel}{delivered ? <CheckCheck size={14} aria-hidden="true" /> : <Clock3 size={14} aria-hidden="true" />}</span>;
        })}
        </div>}
        <div className="noti-item-actions">
          {item.deepLink && <button type="button" className="btn btn-outline btn-sm" onClick={() => onOpen(item)} disabled={busy}>Xem chi tiết <ArrowRight size={16} aria-hidden="true" /></button>}
          {!item.is_read && <button type="button" className="btn btn-outline btn-sm" onClick={() => onRead(item._id)} disabled={busy}><Check size={16} aria-hidden="true" />Đánh dấu đã đọc</button>}
          <button type="button" className="dashboard-icon-button noti-delete" aria-label={`Xóa thông báo: ${item.title}`} onClick={() => onDelete(item._id)} disabled={busy}><Trash2 size={18} aria-hidden="true" /></button>
        </div>
      </div>
    </article>;
}
