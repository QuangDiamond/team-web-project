import { useState } from 'react';
import { Link } from 'react-router-dom';
import OpenChatLink from '../common/OpenChatLink';
import PriorityBadge from '../common/PriorityBadge';
import { INVITATION_STATUS, formatBudget, getModeLabel, getStatusBadge } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';

function ReceivedInvitationRow({ invitation, onAccept, onDecline, onViewDetails }) {
  const [busyAction, setBusyAction] = useState('');
  const badge = getStatusBadge(INVITATION_STATUS, invitation.status);
  const request = invitation.request;

  const runAction = async (actionName, action) => {
    setBusyAction(actionName);
    await action(invitation);
    setBusyAction('');
  };
  const isBusy = busyAction !== '';

  let title = "Yêu cầu không còn khả dụng";
  let metaParts = [];
  let canAccept = false;
  if (request) {
    title = request.title;
    metaParts = [request.subject_name, request.grade_level, getModeLabel(request.teaching_mode), formatBudget(request.budget)];
    if (request.location_address) {
      metaParts.push(request.location_address);
    }
    canAccept = request.is_available;
  }

  return (
    <li className="item-row received-invitation-row">
      <div className="item-row-body">
        <div className="item-row-heading">
          <p className="item-title">{title}</p>
          <span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>
          <PriorityBadge credits={invitation.credits_spent} />
        </div>
        <p className="item-meta">{metaParts.join(' · ')}</p>
        <p className="item-meta">Phụ huynh đã mời bạn · {formatDate(invitation.created_at)}</p>
        {invitation.parent_user_id && <Link to={`/parents/${invitation.parent_user_id}`} className="link">Xem hồ sơ phụ huynh</Link>}
        {invitation.message && <p className="item-note">“{invitation.message}”</p>}
        {invitation.status === 'PENDING' && !canAccept && (
          <p className="received-invitation-warning">Yêu cầu này đã đóng nên không thể chấp nhận lời mời.</p>
        )}
        {invitation.status === 'ACCEPTED' && (
          <p className="received-invitation-chat">Đã mở cuộc trò chuyện.</p>
        )}
      </div>
      <div className="item-actions">
        <button type="button" className="btn btn-outline btn-sm" disabled={isBusy} onClick={() => onViewDetails(invitation)}>
          Xem chi tiết
        </button>
        {invitation.status === 'ACCEPTED' && invitation.conversation_id && (
          <OpenChatLink to={`/tutor/messages/${invitation.conversation_id}`} />
        )}
        {invitation.status === 'PENDING' && (
          <>
            <button type="button" className="btn btn-outline btn-sm" disabled={isBusy} onClick={() => runAction('decline', onDecline)}>
              {busyAction === 'decline' ? 'Đang từ chối...' : 'Từ chối'}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              disabled={isBusy || !canAccept}
              onClick={() => runAction('accept', onAccept)}
            >
              {busyAction === 'accept' ? 'Đang chấp nhận...' : 'Chấp nhận'}
            </button>
          </>
        )}
      </div>
    </li>
  );
}

// Lời mời gia sư nhận được; chỉ liên kết hồ sơ công khai của phụ huynh, không hiển thị thông tin liên hệ.
export default function ReceivedInvitationList({ invitations, onAccept, onDecline, onViewDetails }) {
  return (
    <ul className="item-list">
      {invitations.map((invitation) => (
        <ReceivedInvitationRow
          key={invitation._id}
          invitation={invitation}
          onAccept={onAccept}
          onDecline={onDecline}
          onViewDetails={onViewDetails}
        />
      ))}
    </ul>
  );
}
