import { Link } from 'react-router-dom';

const MODE_LABELS = { ONLINE: 'Online', OFFLINE: 'In person', HYBRID: 'Hybrid' };

const getInitials = (fullName) => {
  const words = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return 'T';
  }
  return words.map((word) => word[0]).join('').slice(0, 2).toUpperCase();
};

const formatPrice = (price) => {
  if (price === null || price === undefined) {
    return 'Price not set';
  }
  return `${Number(price).toLocaleString('vi-VN')} ₫/session`;
};

function RatingText({ rating }) {
  if (rating === null || rating === undefined) {
    return <span>No reviews yet</span>;
  }
  return <span>★ {Number(rating).toFixed(1)}</span>;
}

// Một gia sư được gợi ý (Figma: Applications ai). Nút Invite mở hộp thoại mời gia sư (UC14)
export default function SuggestionCard({ suggestion, rank, isInvited, onInvite }) {
  const { tutor, post } = suggestion;

  let modeText = '';
  if (post.teaching_mode) {
    modeText = MODE_LABELS[post.teaching_mode];
  }

  return (
    <li className="ai-card">
      <div className="ai-card-top">
        <span className="ai-card-rank" aria-label={`Rank ${rank}`}>{rank}</span>
        <span className="ai-card-avatar" aria-hidden="true">{getInitials(tutor.full_name)}</span>
        <div className="ai-card-identity">
          <Link className="ai-card-name" to={`/tutors/${tutor.profile_id}`}>{tutor.full_name}</Link>
          <p className="ai-card-sub">{post.subject_name} · {post.grade_level}</p>
          <p className="ai-card-rating"><RatingText rating={tutor.average_rating} /></p>
        </div>
        {tutor.availability_status === 'NOT_AVAILABLE' && (
          <div className="ai-card-badges">
            <span className="status-badge tone-warning">Not available</span>
          </div>
        )}
      </div>

      <p className="ai-card-meta">
        <Link to={`/tutors/${tutor.profile_id}`} className="link">{post.title}</Link>
        {modeText ? ` · ${modeText}` : ''}
        {' · '}
        <strong>{formatPrice(post.price)}</strong>
      </p>

      {suggestion.ai_reason && <p className="ai-card-reason">{suggestion.ai_reason}</p>}

      <div className="ai-card-actions">
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={isInvited}
          onClick={() => onInvite(suggestion)}
        >
          {isInvited ? 'Invited' : 'Invite'}
        </button>
      </div>
    </li>
  );
}
