import { useState } from 'react';
import { Link } from 'react-router-dom';
import Modal from '../common/Modal';
import OpenChatLink from '../common/OpenChatLink';
import PriorityBadge from '../common/PriorityBadge';
import { APPLICATION_STATUS, REQUEST_STATUS, getStatusBadge } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';
import { getInitials } from '../../utils/getInitials';

/*
 * Chi tiết một đơn ứng tuyển (phụ huynh): gia sư, lời nhắn đầy đủ, request được ứng tuyển.
 * onContinue / onSkip(application) trả về Promise; chỉ hiện nút khi đơn đang PENDING.
 */
export default function ApplicationDetailModal({ application, request, onClose, onContinue, onSkip }) {
  const [busyAction, setBusyAction] = useState('');
  const badge = getStatusBadge(APPLICATION_STATUS, application.status);
  const tutor = application.tutor;

  let tutorName = 'Gia sư';
  let avatarText = 'GS';
  if (tutor) {
    tutorName = tutor.full_name;
    avatarText = getInitials(tutor.full_name);
  }

  const runAction = async (actionName, action) => {
    setBusyAction(actionName);
    await action(application);
    setBusyAction('');
    onClose();
  };

  const isBusy = busyAction !== '';

  let ratingText = 'Chưa có đánh giá';
  if (tutor && tutor.average_rating !== null && tutor.average_rating !== undefined) {
    ratingText = `★ ${Number(tutor.average_rating).toFixed(1)}`;
  }

  let requestBadge = null;
  if (request) {
    requestBadge = getStatusBadge(REQUEST_STATUS, request.status);
  }

  return (
    <Modal title="Chi tiết đơn ứng tuyển" onClose={onClose}>
      <div className="review-detail">
        <div className="review-card-top">
          <span className="review-card-avatar" aria-hidden="true">
            {tutor?.avatar_url ? <img src={tutor.avatar_url} alt="" /> : avatarText}
          </span>
          <div className="review-card-identity">
            <p className="review-card-name">{tutorName}</p>
            {tutor && tutor.headline && <p className="item-meta">{tutor.headline}</p>}
            <p className="review-card-rating">{ratingText}</p>
          </div>
          <div className="review-card-badges">
            <PriorityBadge credits={application.credits_spent} />
            <span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>
          </div>
        </div>

        <dl className="review-detail-facts">
          <div>
            <dt>Ngày ứng tuyển</dt>
            <dd>{formatDate(application.created_at)}</dd>
          </div>
          {request && (
            <div>
              <dt>Yêu cầu</dt>
              <dd>
                {request.title} · {request.subject_name}
                {requestBadge && <span className={`status-badge tone-${requestBadge.tone}`}>{requestBadge.label}</span>}
              </dd>
            </div>
          )}
        </dl>

        <h3 className="review-detail-heading">Lời nhắn từ gia sư</h3>
        {application.note ? (
          <p className="review-detail-note">{application.note}</p>
        ) : (
          <p className="review-card-note is-empty">Gia sư không để lại lời nhắn.</p>
        )}

        {tutor && (
          <p className="review-detail-link">
            <Link to={`/tutors/${tutor.profile_id}`} className="link">Xem hồ sơ đầy đủ của gia sư</Link>
          </p>
        )}

        {application.status === 'CONTINUED' && (
          <div className="review-card-chat">
            <span>Đã mở cuộc trò chuyện.</span>
            {application.conversation_id && <OpenChatLink to={`/parent/messages/${application.conversation_id}`} />}
          </div>
        )}

        {application.status === 'PENDING' && (
          <div className="modal-actions">
            <button type="button" className="btn btn-outline btn-sm" disabled={isBusy} onClick={() => runAction('skip', onSkip)}>
              {busyAction === 'skip' ? 'Đang bỏ qua...' : 'Bỏ qua'}
            </button>
            <button type="button" className="btn btn-primary btn-sm" disabled={isBusy} onClick={() => runAction('continue', onContinue)}>
              {busyAction === 'continue' ? 'Đang mở...' : 'Tiếp tục'}
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
