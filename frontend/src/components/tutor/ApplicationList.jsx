import { useState } from 'react';
import OpenChatLink from '../common/OpenChatLink';
import { APPLICATION_STATUS, getStatusBadge } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';

function ApplicationRow({ application, onWithdraw }) {
  const [withdrawing, setWithdrawing] = useState(false);
  const badge = getStatusBadge(APPLICATION_STATUS, application.status);

  let requestTitle = "Yêu cầu không còn khả dụng";
  let subject = '';
  if (application.request) {
    requestTitle = application.request.title;
    subject = application.request.subject_name;
  }

  const metaParts = [];
  if (subject) {
    metaParts.push(subject);
  }
  metaParts.push(`Ứng tuyển lúc ${formatDate(application.created_at)}`);
  metaParts.push(`đã dùng ${application.credits_spent} credits`);

  const handleWithdraw = async () => {
    setWithdrawing(true);
    await onWithdraw(application);
    setWithdrawing(false);
  };

  return (
    <li className="item-row">
      <div className="item-row-body">
        <div className="item-row-heading">
          <p className="item-title">{requestTitle}</p>
          <span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>
        </div>
        <p className="item-meta">{metaParts.join(' · ')}</p>
        {application.note && <p className="item-note">“{application.note}”</p>}
        {application.status === 'CONTINUED' && (
          <p className="item-meta">Phụ huynh đã đồng ý trao đổi với bạn. Cuộc trò chuyện đã được mở.</p>
        )}
      </div>
      {application.status === 'PENDING' && (
        <div className="item-actions">
          <button type="button" className="btn btn-outline btn-sm" disabled={withdrawing} onClick={handleWithdraw}>
            {withdrawing ? "Đang rút..." : "Rút đơn"}
          </button>
        </div>
      )}
      {application.status === 'CONTINUED' && application.conversation_id && (
        <div className="item-actions">
          <OpenChatLink to={`/tutor/messages/${application.conversation_id}`} />
        </div>
      )}
    </li>
  );
}

// Danh sách đơn ứng tuyển của gia sư; onWithdraw(application) trả về Promise
export default function ApplicationList({ applications, onWithdraw }) {
  return (
    <ul className="item-list">
      {applications.map((application) => (
        <ApplicationRow key={application._id} application={application} onWithdraw={onWithdraw} />
      ))}
    </ul>
  );
}
