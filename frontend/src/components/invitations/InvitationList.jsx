import { useState } from 'react';
import { Link } from 'react-router-dom';
import OpenChatLink from '../common/OpenChatLink';
import { INVITATION_STATUS, getStatusBadge } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';

function InvitationRow({ invitation, onCancel }) {
  const [cancelling, setCancelling] = useState(false);
  const badge = getStatusBadge(INVITATION_STATUS, invitation.status);

  let tutorName = "Gia sư";
  if (invitation.tutor && invitation.tutor.full_name) {
    tutorName = invitation.tutor.full_name;
  }
  let requestTitle = "Yêu cầu không còn khả dụng";
  if (invitation.request) {
    requestTitle = invitation.request.title;
  }

  const handleCancel = async () => {
    setCancelling(true);
    await onCancel(invitation);
    setCancelling(false);
  };

  return (
    <li className="item-row">
      <div className="item-row-body">
        <div className="item-row-heading">
          <p className="item-title">{tutorName}</p>
          <span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>
        </div>
        <p className="item-meta">
          Cho yêu cầu {requestTitle} · Đã gửi {formatDate(invitation.created_at)} · đã dùng {invitation.credits_spent} credits
        </p>
        {invitation.message && <p className="item-note">“{invitation.message}”</p>}
        {invitation.status === 'ACCEPTED' && (
          <p className="item-meta">Gia sư đã chấp nhận. Cuộc trò chuyện đã được mở.</p>
        )}
      </div>
      <div className="item-actions">
        {invitation.tutor && (
          <Link to={`/tutors/${invitation.tutor.profile_id}`} className="btn btn-outline btn-sm">Xem chi tiết</Link>
        )}
        {invitation.status === 'PENDING' && (
          <button type="button" className="btn btn-outline btn-sm" disabled={cancelling} onClick={handleCancel}>
            {cancelling ? "Đang hủy..." : "Hủy lời mời"}
          </button>
        )}
      </div>
      {invitation.status === 'ACCEPTED' && invitation.conversation_id && (
        <div className="item-actions">
          <OpenChatLink to={`/parent/messages/${invitation.conversation_id}`} />
        </div>
      )}
    </li>
  );
}

// Danh sách lời mời phụ huynh đã gửi; onCancel(invitation) trả về Promise
export default function InvitationList({ invitations, onCancel }) {
  return (
    <ul className="item-list">
      {invitations.map((invitation) => (
        <InvitationRow key={invitation._id} invitation={invitation} onCancel={onCancel} />
      ))}
    </ul>
  );
}
