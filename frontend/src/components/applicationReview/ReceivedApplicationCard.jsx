import { useState } from 'react';
import { Link } from 'react-router-dom';
import OpenChatLink from '../common/OpenChatLink';
import { APPLICATION_STATUS, getStatusBadge } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';
import { getInitials } from '../../utils/getInitials';

function RatingText({ rating }) {
  if (rating === null || rating === undefined) {
    return <span>Chưa có đánh giá</span>;
  }
  return <span>★ {Number(rating).toFixed(1)}</span>;
}

/*
 * Một đơn ứng tuyển phụ huynh nhận được (Figma: Applications review).
 * onContinue / onSkip(application) trả về Promise; chỉ hiện nút khi đơn đang PENDING.
 */
export default function ReceivedApplicationCard({ application, onContinue, onSkip }) {
  const [busyAction, setBusyAction] = useState('');
  const badge = getStatusBadge(APPLICATION_STATUS, application.status);
  const tutor = application.tutor;

  let tutorName = "Gia sư";
  let headline = '';
  let avatarText = 'T';
  if (tutor) {
    tutorName = tutor.full_name;
    headline = tutor.headline || '';
    avatarText = getInitials(tutor.full_name);
  }

  const runAction = async (actionName, action) => {
    setBusyAction(actionName);
    await action(application);
    setBusyAction('');
  };

  const isBusy = busyAction !== '';

  return (
    <li className="review-card">
      <div className="review-card-top">
        <span className="review-card-avatar" aria-hidden="true">{avatarText}</span>
        <div className="review-card-identity">
          {tutor ? <Link to={`/tutors/${tutor.profile_id}`} className="review-card-name">{tutorName}</Link> : <p className="review-card-name">{tutorName}</p>}
          {headline && <p className="item-meta">{headline}</p>}
          <p className="review-card-rating">{tutor ? <RatingText rating={tutor.average_rating} /> : null}</p>
        </div>
        <div className="review-card-badges">
          {application.match_score !== null && application.match_score !== undefined && (
            <span className="status-badge tone-primary">{application.match_score}% phù hợp</span>
          )}
          <span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>
        </div>
      </div>

      {application.note ? (
        <p className="review-card-note">“{application.note}”</p>
      ) : (
        <p className="review-card-note is-empty">Gia sư chưa để lại lời nhắn.</p>
      )}
      <p className="item-meta">Đã ứng tuyển {formatDate(application.created_at)}</p>

      {application.status === 'PENDING' && (
        <div className="review-card-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={isBusy}
            onClick={() => runAction('skip', onSkip)}
          >
            {busyAction === 'skip' ? "Đang bỏ qua..." : "Bỏ qua"}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={isBusy}
            onClick={() => runAction('continue', onContinue)}
          >
            {busyAction === 'continue' ? "Đang mở..." : "Tiếp tục"}
          </button>
        </div>
      )}

      {application.status === 'CONTINUED' && (
        <div className="review-card-chat">
          <span>Đã mở cuộc trò chuyện.</span>
          {application.conversation_id && <OpenChatLink to={`/parent/messages/${application.conversation_id}`} />}
        </div>
      )}
    </li>
  );
}
