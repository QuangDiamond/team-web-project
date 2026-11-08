import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../common/Modal';
import OpenChatLink from '../common/OpenChatLink';
import PriorityBadge from '../common/PriorityBadge';
import { INVITATION_STATUS, formatBudget, getModeLabel, getStatusBadge } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';

/*
 * Chi tiết một lời mời gia sư nhận được: yêu cầu của phụ huynh (môn, khối, lịch, ngân sách, mô tả...) và lời nhắn.
 * Không hiển thị thông tin liên hệ. onAccept / onDecline(invitation) trả về Promise; chỉ hiện nút khi lời mời đang PENDING.
 */
export default function InvitationDetailModal({ invitation, onClose, onAccept, onDecline }) {
  const [busyAction, setBusyAction] = useState('');
  const badge = getStatusBadge(INVITATION_STATUS, invitation.status);
  const request = invitation.request;
  const isBusy = busyAction !== '';

  let canAccept = false;
  if (request) {
    canAccept = request.is_available;
  }

  const runAction = async (actionName, action) => {
    setBusyAction(actionName);
    await action(invitation);
    setBusyAction('');
    onClose();
  };

  let facts = [];
  if (request) {
    facts = [
      ['Môn học', request.subject_name],
      ['Khối lớp', request.grade_level],
      ['Ngân sách', formatBudget(request.budget)],
      ['Lịch học', request.schedule || '—'],
      ['Hình thức học', getModeLabel(request.teaching_mode)],
      ['Địa điểm', request.location_address || '—'],
    ];
  }

  return (
    <Modal title="Chi tiết lời mời" onClose={onClose}>
      <div className="review-detail">
        <div className="review-card-top">
          <div className="review-card-identity">
            {request ? <p className="review-card-name">{request.title}</p> : <p className="review-card-name">Yêu cầu không còn khả dụng</p>}
            <p className="item-meta">Nhận ngày {formatDate(invitation.created_at)}</p>
          </div>
          <div className="review-card-badges">
            <PriorityBadge credits={invitation.credits_spent} />
            <span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>
          </div>
        </div>

        {request && (
          <>
            <dl className="request-facts">
              {facts.map((fact) => (
                <div key={fact[0]} className="request-fact">
                  <dt>{fact[0]}</dt>
                  <dd>{fact[1]}</dd>
                </div>
              ))}
            </dl>
            <h3 className="review-detail-heading">Mục tiêu học tập</h3>
            <p className="review-detail-note">{request.description || '—'}</p>
            {request.tutor_requirements && (
              <>
                <h3 className="review-detail-heading">Yêu cầu đối với gia sư</h3>
                <p className="review-detail-note">{request.tutor_requirements}</p>
              </>
            )}
          </>
        )}

        <h3 className="review-detail-heading">Lời nhắn từ phụ huynh</h3>
        {invitation.message ? (
          <p className="review-detail-note">{invitation.message}</p>
        ) : (
          <p className="review-card-note is-empty">Phụ huynh không để lại lời nhắn.</p>
        )}

        {invitation.parent_user_id && (
          <p className="review-detail-link">
            <Link to={`/parents/${invitation.parent_user_id}`} className="link">Xem hồ sơ phụ huynh</Link>
          </p>
        )}

        {invitation.status === 'PENDING' && !canAccept && (
          <p className="received-invitation-warning">Yêu cầu này không còn mở nên không thể chấp nhận lời mời.</p>
        )}

        {invitation.status === 'ACCEPTED' && (
          <div className="review-card-chat">
            <span>Đã mở cuộc trò chuyện.</span>
            {invitation.conversation_id && <OpenChatLink to={`/tutor/messages/${invitation.conversation_id}`} />}
          </div>
        )}

        {invitation.status === 'PENDING' && (
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" disabled={isBusy} onClick={() => runAction('decline', onDecline)}>
              {busyAction === 'decline' ? 'Đang từ chối...' : 'Từ chối'}
            </button>
            <button type="button" className="btn btn-primary btn-sm" disabled={isBusy || !canAccept} onClick={() => runAction('accept', onAccept)}>
              {busyAction === 'accept' ? 'Đang chấp nhận...' : 'Chấp nhận'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
