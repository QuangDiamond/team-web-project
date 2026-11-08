import { Link } from 'react-router-dom';

const MODE_LABELS = { ONLINE: "Trực tuyến", OFFLINE: "Trực tiếp", HYBRID: "Kết hợp" };

const getInitials = (fullName) => {
  const words = (fullName || '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return 'GS';
  }
  return words.map((word) => word[0]).join('').slice(0, 2).toUpperCase();
};

const formatPrice = (price) => {
  if (price === null || price === undefined) {
    return "Chưa có học phí";
  }
  return `${Number(price).toLocaleString('vi-VN')} ₫/buổi`;
};

function RatingText({ rating }) {
  if (rating === null || rating === undefined) {
    return <span>Chưa có đánh giá</span>;
  }
  return <span>★ {Number(rating).toFixed(1)}</span>;
}

// Một gia sư được gợi ý (Figma: Applications ai). Nút Mời mở hộp thoại mời gia sư (UC14), Xem chi tiết mở hồ sơ công khai
export default function SuggestionCard({ suggestion, rank, isInvited, onInvite }) {
  const { tutor, post } = suggestion;

  let modeText = '';
  if (post.teaching_mode) {
    modeText = MODE_LABELS[post.teaching_mode];
  }

  return (
    <li className="ai-card">
      <div className="ai-card-top">
        <span className="ai-card-rank" aria-label={`Thứ hạng ${rank}`}>{rank}</span>
        <span className="ai-card-avatar" aria-hidden="true">{getInitials(tutor.full_name)}</span>
        <div className="ai-card-identity">
          <p className="ai-card-name">{tutor.full_name}</p>
          <p className="ai-card-sub">{post.subject_name} · {post.grade_level}</p>
          <p className="ai-card-rating"><RatingText rating={tutor.average_rating} /></p>
        </div>
        {tutor.availability_status === 'NOT_AVAILABLE' && (
          <div className="ai-card-badges">
            <span className="status-badge tone-warning">Tạm không nhận</span>
          </div>
        )}
      </div>

      <p className="ai-card-meta">
        <span>{post.title}</span>
        {modeText ? ` · ${modeText}` : ''}
        {' · '}
        <strong>{formatPrice(post.price)}</strong>
      </p>

      {suggestion.ai_reason && <p className="ai-card-reason">{suggestion.ai_reason}</p>}

      <div className="ai-card-actions">
        <Link to={`/tutors/${tutor.profile_id}`} className="btn btn-outline btn-sm">Xem chi tiết</Link>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          disabled={isInvited}
          onClick={() => onInvite(suggestion)}
        >
          {isInvited ? "Đã mời" : "Mời"}
        </button>
      </div>
    </li>
  );
}
