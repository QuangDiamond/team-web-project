import { UserRound } from 'lucide-react';
import { formatDate } from '../../utils/dateFormat';
import { LINK_STATUS } from './linkLabels';

// Một dòng liên kết: người ở bên kia, trạng thái, ngày gửi và các nút thao tác (actions) do màn hình truyền vào
export default function LinkRow({ person, status, createdAt, actions }) {
  const statusInfo = LINK_STATUS[status];
  let displayName = 'Tài khoản không còn tồn tại';
  let email = '';
  if (person) {
    displayName = person.full_name || person.email;
    email = person.email;
  }

  return (
    <li className="progress-row">
      <span className="progress-row-icon" aria-hidden="true"><UserRound size={18} /></span>
      <div className="progress-row-body">
        <div className="progress-row-heading">
          <p className="progress-row-title">{displayName}</p>
          {statusInfo && <span className={`status-badge tone-${statusInfo.tone}`}>{statusInfo.label}</span>}
        </div>
        <p className="progress-row-meta">{email} · Gửi ngày {formatDate(createdAt)}</p>
      </div>
      <div className="parent-link-actions">{actions}</div>
    </li>
  );
}
