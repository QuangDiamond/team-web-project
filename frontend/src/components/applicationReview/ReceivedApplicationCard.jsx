import { useState } from 'react';
import { APPLICATION_STATUS, getStatusBadge } from '../../constants/requestLabels';
import { formatDate } from '../../utils/dateFormat';
import { getInitials } from '../../utils/getInitials';

function RatingText({ rating }) {
  if (rating === null || rating === undefined) {
    return <span>No reviews yet</span>;
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

  let tutorName = 'Tutor';
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
          <p className="review-card-name">{tutorName}</p>
          {headline && <p className="item-meta">{headline}</p>}
          <p className="review-card-rating">{tutor ? <RatingText rating={tutor.average_rating} /> : null}</p>
        </div>
        <div className="review-card-badges">
          {application.match_score !== null && application.match_score !== undefined && (
            <span className="status-badge tone-primary">{application.match_score}% match</span>
          )}
          <span className={`status-badge tone-${badge.tone}`}>{badge.label}</span>
        </div>
      </div>

      {application.note ? (
        <p className="review-card-note">“{application.note}”</p>
      ) : (
        <p className="review-card-note is-empty">The tutor did not leave a note.</p>
      )}
      <p className="item-meta">Applied {formatDate(application.created_at)}</p>

      {application.status === 'PENDING' && (
        <div className="review-card-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={isBusy}
            onClick={() => runAction('skip', onSkip)}
          >
            {busyAction === 'skip' ? 'Skipping...' : 'Skip'}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={isBusy}
            onClick={() => runAction('continue', onContinue)}
          >
            {busyAction === 'continue' ? 'Opening...' : 'Continue'}
          </button>
        </div>
      )}

      {application.status === 'CONTINUED' && (
        <p className="review-card-chat">Conversation opened. Messaging is coming soon.</p>
      )}
    </li>
  );
}
